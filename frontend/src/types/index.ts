export type UserRole = 'ADMINISTRATOR' | 'INSPECTOR' | 'SUPERVISOR' | 'WAREHOUSE_OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  center_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProcurementCenter {
  id: string;
  code: string;
  name: string;
  state: string;
  district: string;
  address?: string;
  capacity_mt: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  aadhaar_masked?: string;
  mandi_license?: string;
  location: string;
  district: string;
  state: string;
  bank_account_masked?: string;
}

export interface Lot {
  id: string;
  lot_number: string;
  supplier_id: string;
  supplier_name?: string;
  center_id: string;
  center_name?: string;
  initial_quantity_mt: number;
  bag_count: number;
  variety: string;
  harvested_date?: string;
  arrival_date: string;
  status: 'PENDING_INSPECTION' | 'INSPECTED' | 'REINSPECTION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'IN_STORAGE';
  current_grade?: 'GRADE_A' | 'URS' | 'REJECTED';
  grade_a_percentage?: number;
  urs_percentage?: number;
  created_at: string;
}

export interface DetectionDetail {
  onion_index: number;
  class_name: 'Healthy' | 'Rotten' | 'Damaged' | 'Sprouted' | 'Undersized';
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  diameter_mm: number;
  severity?: string;
  needs_review: boolean;
  inspector_override_class?: string;
  inspector_notes?: string;
}

export interface ImageQualityCheck {
  status: 'PASSED' | 'BLURRED' | 'LOW_LIGHT' | 'OVEREXPOSED' | 'OCCLUSION' | 'ERROR';
  blur_score: number;
  brightness_score: number;
  exposure_score: number;
  guidance?: string;
}

export interface AIAnalysisResult {
  image_id: string;
  image_url: string;
  quality: ImageQualityCheck;
  detections: DetectionDetail[];
  summary: {
    total: number;
    healthy: number;
    rotten: number;
    damaged: number;
    sprouted: number;
    undersized: number;
    needs_review: number;
  };
  mean_confidence: number;
  recommended_grade: 'GRADE_A' | 'URS' | 'REJECTED' | 'REINSPECTION_REQUIRED';
  grade_a_percentage: number;
  urs_percentage: number;
  needs_reinspection: boolean;
  explanation: string[];
}

export interface WeightRecord {
  id: string;
  inspection_id: string;
  gross_sample_weight_kg: number;
  tare_weight_kg: number;
  net_sample_weight_kg: number;
  accepted_weight_kg: number;
  rejected_weight_kg: number;
  grade_a_weight_percentage: number;
  urs_weight_percentage: number;
  scale_device_type: string;
  scale_connected: boolean;
  recorded_at: string;
}

export interface Inspection {
  id: string;
  inspection_number: string;
  lot_id: string;
  lot_number?: string;
  supplier_name?: string;
  inspector_id: string;
  inspector_name?: string;
  center_id: string;
  center_name?: string;
  rule_version_id: string;
  rule_version_name?: string;
  status: 'IN_PROGRESS' | 'AI_COMPLETED' | 'REVIEW_REQUIRED' | 'FINALIZED' | 'REINSPECTED';
  confidence_score: number;
  grade_result?: 'GRADE_A' | 'URS' | 'REJECTED';
  grade_a_percentage: number;
  urs_percentage: number;
  total_detected_count: number;
  healthy_count: number;
  rotten_count: number;
  damaged_count: number;
  sprouted_count: number;
  undersized_count: number;
  needs_review_count: number;
  notes?: string;
  created_at: string;
  finalized_at?: string;
  detections?: DetectionDetail[];
  weight_record?: WeightRecord;
  image_url?: string;
}

export interface Reinspection {
  id: string;
  reinspection_number: string;
  original_inspection_id: string;
  lot_id: string;
  lot_number?: string;
  inspector_id: string;
  inspector_name?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  reason_code: string;
  reason_description: string;
  original_grade: string;
  new_grade?: string;
  status: 'PENDING_REVIEW' | 'APPROVED_NEW_GRADE' | 'UPHELD_ORIGINAL' | 'REJECTED';
  supervisor_decision?: string;
  supervisor_remarks?: string;
  created_at: string;
  finalized_at?: string;
}

export interface QualityPassport {
  id: string;
  passport_uuid: string;
  lot_id: string;
  lot_number: string;
  supplier: {
    id: string;
    name: string;
    phone: string;
    mandi_license: string;
    location: string;
  };
  center: {
    id: string;
    code: string;
    name: string;
    state: string;
    district: string;
  };
  grade_classification: string;
  grade_a_pct: number;
  urs_pct: number;
  tamper_hash: string;
  is_locked: boolean;
  inspection_timeline: Array<{
    stage: string;
    number: string;
    status: string;
    grade: string;
    grade_a_pct: number;
    urs_pct: number;
    timestamp: string;
    notes?: string;
  }>;
  storage_history: Array<{
    bay: string;
    temperature_c: number;
    relative_humidity_pct: number;
    rot_pct: number;
    sprout_pct: number;
    weight_loss_pct: number;
    risk_level: string;
    recorded_at: string;
  }>;
  qr_code_payload: string;
  generated_at: string;
}

export interface StorageReading {
  id: string;
  lot_id: string;
  center_id: string;
  warehouse_bay: string;
  temperature_c: number;
  relative_humidity_pct: number;
  rot_incidence_pct: number;
  sprouting_incidence_pct: number;
  weight_loss_pct: number;
  deterioration_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_factors: {
    risk_level?: string;
    risk_score?: number;
    storage_days?: number;
    primary_factors?: string[];
    actionable_recommendations?: string[];
  };
  recorded_by_id: string;
  recorded_at: string;
}

export interface ProcurementRule {
  id: string;
  rule_code: string;
  name: string;
  version: string;
  department: string;
  is_active: boolean;
  min_size_mm: number;
  max_undersized_tolerance_pct: number;
  max_rot_tolerance_pct: number;
  max_damage_tolerance_pct: number;
  max_sprout_tolerance_pct: number;
  max_total_defect_tolerance_pct: number;
  grade_a_definition: string;
  urs_definition: string;
  effective_from: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}
