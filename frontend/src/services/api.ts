import {
  User, Lot, Inspection, AIAnalysisResult, Reinspection,
  QualityPassport, StorageReading, ProcurementRule, AuditLog,
  ProcurementCenter, Supplier, WeightRecord
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('pyaaz_pro_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('pyaaz_pro_token', token);
    } else {
      localStorage.removeItem('pyaaz_pro_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.detail) errMessage = errData.detail;
        } catch (_) {}
        throw new Error(errMessage);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[API] Network error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth & Personas
  async getPersonas(): Promise<User[]> {
    return this.request<User[]>('/auth/personas');
  }

  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  // Lots & Intake
  async getLots(centerId?: string, status?: string, search?: string): Promise<Lot[]> {
    const params = new URLSearchParams();
    if (centerId) params.append('center_id', centerId);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return this.request<Lot[]>(`/lots?${params.toString()}`);
  }

  async getLot(id: string): Promise<Lot> {
    return this.request<Lot>(`/lots/${id}`);
  }

  async createLot(payload: {
    supplier_id: string;
    center_id: string;
    initial_quantity_mt: number;
    bag_count: number;
    variety: string;
    lot_number?: string;
  }): Promise<Lot> {
    return this.request<Lot>('/lots', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createSample(payload: {
    lot_id: string;
    sample_weight_kg: number;
    sample_onion_count?: number;
    sampling_method?: string;
    bag_sample_locations?: string;
  }, inspectorId: string): Promise<any> {
    return this.request<any>(`/lots/samples?inspector_id=${inspectorId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Inspections
  async getInspections(centerId?: string, status?: string, lotId?: string): Promise<Inspection[]> {
    const params = new URLSearchParams();
    if (centerId) params.append('center_id', centerId);
    if (status) params.append('status', status);
    if (lotId) params.append('lot_id', lotId);
    return this.request<Inspection[]>(`/inspections?${params.toString()}`);
  }

  async getInspection(id: string): Promise<Inspection> {
    return this.request<Inspection>(`/inspections/${id}`);
  }

  async startInspection(payload: {
    lot_id: string;
    sample_id?: string;
    center_id: string;
    rule_version_id?: string;
    notes?: string;
  }, inspectorId: string): Promise<Inspection> {
    return this.request<Inspection>(`/inspections/start?inspector_id=${inspectorId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async analyzeInspectionImage(
    inspectionId: string,
    file?: File,
    calibrationRatio?: number
  ): Promise<AIAnalysisResult> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (calibrationRatio) formData.append('calibration_ratio', calibrationRatio.toString());

    return this.request<AIAnalysisResult>(`/inspections/${inspectionId}/analyze-image`, {
      method: 'POST',
      body: formData,
    });
  }

  async overrideDetection(
    detectionId: string,
    overrideClass: string,
    notes: string,
    inspectorId: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('override_class', overrideClass);
    if (notes) formData.append('notes', notes);

    return this.request<any>(`/inspections/detections/${detectionId}/override?inspector_id=${inspectorId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async recordWeight(payload: {
    inspection_id: string;
    gross_sample_weight_kg: number;
    tare_weight_kg: number;
    accepted_weight_kg: number;
    rejected_weight_kg: number;
    scale_device_type?: string;
    scale_connected?: boolean;
  }): Promise<WeightRecord> {
    return this.request<WeightRecord>('/inspections/weight', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async finalizeInspection(inspectionId: string, notes?: string): Promise<Inspection> {
    const formData = new FormData();
    if (notes) formData.append('notes', notes);

    return this.request<Inspection>(`/inspections/${inspectionId}/finalize`, {
      method: 'POST',
      body: formData,
    });
  }

  // Reinspections
  async getReinspections(): Promise<Reinspection[]> {
    return this.request<Reinspection[]>('/reinspections');
  }

  async createReinspection(
    payload: { original_inspection_id: string; reason_code: string; reason_description: string },
    inspectorId: string
  ): Promise<Reinspection> {
    return this.request<Reinspection>(`/reinspections?inspector_id=${inspectorId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async decideReinspection(
    reinspectionId: string,
    payload: { status: string; new_grade?: string; supervisor_remarks: string },
    supervisorId: string
  ): Promise<Reinspection> {
    return this.request<Reinspection>(`/reinspections/${reinspectionId}/decision?supervisor_id=${supervisorId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Quality Passports
  async getQualityPassport(lotId: string): Promise<QualityPassport> {
    return this.request<QualityPassport>(`/quality-passports/${lotId}`);
  }

  // Reports
  async getReports(): Promise<any[]> {
    return this.request<any[]>('/reports');
  }

  async getReportDetail(reportId: string): Promise<any> {
    return this.request<any>(`/reports/${reportId}`);
  }

  // Storage
  async getStorageReadings(lotId?: string, riskLevel?: string): Promise<StorageReading[]> {
    const params = new URLSearchParams();
    if (lotId) params.append('lot_id', lotId);
    if (riskLevel) params.append('risk_level', riskLevel);
    return this.request<StorageReading[]>(`/storage?${params.toString()}`);
  }

  async addStorageReading(payload: {
    lot_id: string;
    warehouse_bay: string;
    temperature_c: number;
    relative_humidity_pct: number;
    rot_incidence_pct: number;
    sprouting_incidence_pct: number;
    weight_loss_pct: number;
  }, operatorId: string): Promise<StorageReading> {
    return this.request<StorageReading>(`/storage?operator_id=${operatorId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    return this.request<any>('/analytics/summary');
  }

  // Models
  async getModels(): Promise<any[]> {
    return this.request<any[]>('/models');
  }

  async getActiveModelEvaluation(): Promise<any> {
    return this.request<any>('/models/evaluation/active');
  }

  async getDatasets(): Promise<any[]> {
    return this.request<any[]>('/models/datasets');
  }

  // Rules & Standards
  async getRules(): Promise<ProcurementRule[]> {
    return this.request<ProcurementRule[]>('/rules');
  }

  async activateRule(ruleId: string): Promise<ProcurementRule> {
    return this.request<ProcurementRule>(`/rules/${ruleId}/activate`, {
      method: 'PUT',
    });
  }

  async createRule(payload: any): Promise<ProcurementRule> {
    return this.request<ProcurementRule>('/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Audit Logs
  async getAuditLogs(action?: string, entityType?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (entityType) params.append('entity_type', entityType);
    return this.request<AuditLog[]>(`/audit?${params.toString()}`);
  }

  // Users & Centers
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getCenters(): Promise<ProcurementCenter[]> {
    return this.request<ProcurementCenter[]>('/users/centers');
  }

  // ── Live YOLO detection ────────────────────────────────────────────────────
  /** Send a single base64-encoded camera frame; returns YOLO bounding boxes. */
  async liveDetectFrame(frameBase64: string): Promise<LiveDetectResult> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const resp = await fetch(`${API_BASE_URL}/inspections/live-detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame: frameBase64 }),
    });
    if (!resp.ok) throw new Error(`Live detect error ${resp.status}`);
    return resp.json();
  }
}

export const api = new ApiService();

// ── Live detection types (used by LiveInspectionCamera) ──────────────────────
export interface LiveDetection {
  class_name: 'Healthy' | 'Rotten' | 'Sprouted' | 'Damaged';
  confidence: number;
  color: string;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in frame pixels
  diameter_mm: number | null;
  decision: 'CHOOSE' | 'DO NOT CHOOSE';
  quality_score: number;
  size_grade: string;
}

export interface LiveDetectResult {
  detections: LiveDetection[];
  frame_width: number;
  frame_height: number;
  model: string;
  error?: string;
}
