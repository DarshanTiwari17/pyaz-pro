from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# User & Auth
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    center_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

# Procurement Center
class ProcurementCenterResponse(BaseModel):
    id: str
    code: str
    name: str
    state: str
    district: str
    address: Optional[str]
    capacity_mt: float
    created_at: datetime
    class Config:
        from_attributes = True

# Supplier
class SupplierBase(BaseModel):
    code: str
    name: str
    phone: str
    aadhaar_masked: Optional[str] = None
    mandi_license: Optional[str] = None
    location: str
    district: str
    state: str
    bank_account_masked: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# Lot
class LotBase(BaseModel):
    supplier_id: str
    center_id: str
    initial_quantity_mt: float
    bag_count: int
    variety: str = "Nashik Red"
    harvested_date: Optional[datetime] = None

class LotCreate(LotBase):
    lot_number: Optional[str] = None

class LotResponse(BaseModel):
    id: str
    lot_number: str
    supplier_id: str
    supplier_name: Optional[str] = None
    center_id: str
    center_name: Optional[str] = None
    initial_quantity_mt: float
    bag_count: int
    variety: str
    harvested_date: Optional[datetime]
    arrival_date: datetime
    status: str
    current_grade: Optional[str]
    grade_a_percentage: Optional[float]
    urs_percentage: Optional[float]
    created_at: datetime
    class Config:
        from_attributes = True

# Sample
class SampleCreate(BaseModel):
    lot_id: str
    sample_weight_kg: float
    sample_onion_count: Optional[int] = None
    sampling_method: str = "Random 5-Bag Grid Cross-Section"
    bag_sample_locations: str = "Bags #1, #14, #28, #42, #55"

class SampleResponse(BaseModel):
    id: str
    lot_id: str
    sample_code: str
    sample_weight_kg: float
    sample_onion_count: Optional[int]
    sampling_method: str
    bag_sample_locations: str
    inspector_id: str
    created_at: datetime
    class Config:
        from_attributes = True

# Detections
class DetectionDetail(BaseModel):
    onion_index: int
    class_name: str # Healthy, Rotten, Damaged, Sprouted, Undersized
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    diameter_mm: float
    severity: Optional[str] = None
    needs_review: bool = False
    inspector_override_class: Optional[str] = None
    inspector_notes: Optional[str] = None

# AI Analysis Request & Result
class ImageQualityCheck(BaseModel):
    status: str # PASSED, BLURRED, LOW_LIGHT, OVEREXPOSED, OCCLUSION
    blur_score: float
    brightness_score: float
    exposure_score: float
    guidance: Optional[str] = None

class AIAnalysisResult(BaseModel):
    image_id: str
    image_url: str
    quality: ImageQualityCheck
    detections: List[DetectionDetail]
    summary: Dict[str, int]
    mean_confidence: float
    recommended_grade: str
    grade_a_percentage: float
    urs_percentage: float
    needs_reinspection: bool
    explanation: List[str]

# Weight Record
class WeightRecordCreate(BaseModel):
    inspection_id: str
    gross_sample_weight_kg: float
    tare_weight_kg: float = 0.25
    accepted_weight_kg: float
    rejected_weight_kg: float = 0.0
    scale_device_type: str = "MANUAL_ENTRY"
    scale_connected: bool = False

class WeightRecordResponse(BaseModel):
    id: str
    inspection_id: str
    gross_sample_weight_kg: float
    tare_weight_kg: float
    net_sample_weight_kg: float
    accepted_weight_kg: float
    rejected_weight_kg: float
    grade_a_weight_percentage: float
    urs_weight_percentage: float
    scale_device_type: str
    scale_connected: bool
    recorded_at: datetime
    class Config:
        from_attributes = True

# Inspection
class InspectionCreate(BaseModel):
    lot_id: str
    sample_id: Optional[str] = None
    center_id: str
    rule_version_id: Optional[str] = None
    notes: Optional[str] = None

class InspectionResponse(BaseModel):
    id: str
    inspection_number: str
    lot_id: str
    lot_number: Optional[str] = None
    supplier_name: Optional[str] = None
    inspector_id: str
    inspector_name: Optional[str] = None
    center_id: str
    center_name: Optional[str] = None
    rule_version_id: str
    rule_version_name: Optional[str] = None
    status: str
    confidence_score: float
    grade_result: Optional[str]
    grade_a_percentage: float
    urs_percentage: float
    total_detected_count: int
    healthy_count: int
    rotten_count: int
    damaged_count: int
    sprouted_count: int
    undersized_count: int
    needs_review_count: int
    notes: Optional[str]
    created_at: datetime
    finalized_at: Optional[datetime]
    detections: Optional[List[DetectionDetail]] = []
    weight_record: Optional[WeightRecordResponse] = None
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

# Reinspection
class ReinspectionCreate(BaseModel):
    original_inspection_id: str
    reason_code: str
    reason_description: str

class ReinspectionDecision(BaseModel):
    status: str # APPROVED_NEW_GRADE, UPHELD_ORIGINAL, REJECTED
    new_grade: Optional[str] = None
    supervisor_remarks: str

class ReinspectionResponse(BaseModel):
    id: str
    reinspection_number: str
    original_inspection_id: str
    lot_id: str
    lot_number: Optional[str] = None
    inspector_id: str
    inspector_name: Optional[str] = None
    supervisor_id: Optional[str] = None
    supervisor_name: Optional[str] = None
    reason_code: str
    reason_description: str
    original_grade: str
    new_grade: Optional[str]
    status: str
    supervisor_decision: Optional[str]
    supervisor_remarks: Optional[str]
    created_at: datetime
    finalized_at: Optional[datetime]
    class Config:
        from_attributes = True

# Quality Passport
class QualityPassportResponse(BaseModel):
    id: str
    passport_uuid: str
    lot_id: str
    lot_number: str
    supplier: Dict[str, Any]
    center: Dict[str, Any]
    grade_classification: str
    grade_a_pct: float
    urs_pct: float
    tamper_hash: str
    is_locked: bool
    inspection_timeline: List[Dict[str, Any]]
    storage_history: List[Dict[str, Any]]
    qr_code_payload: str
    generated_at: datetime
    class Config:
        from_attributes = True

# Storage Monitoring
class StorageReadingCreate(BaseModel):
    lot_id: str
    warehouse_bay: str = "Bay-C04"
    temperature_c: float
    relative_humidity_pct: float
    rot_incidence_pct: float = 0.0
    sprouting_incidence_pct: float = 0.0
    weight_loss_pct: float = 0.0

class StorageReadingResponse(BaseModel):
    id: str
    lot_id: str
    center_id: str
    warehouse_bay: str
    temperature_c: float
    relative_humidity_pct: float
    rot_incidence_pct: float
    sprouting_incidence_pct: float
    weight_loss_pct: float
    deterioration_risk_level: str
    risk_factors: Dict[str, Any]
    recorded_by_id: str
    recorded_at: datetime
    class Config:
        from_attributes = True

# Procurement Rules
class ProcurementRuleBase(BaseModel):
    rule_code: str
    name: str
    version: str
    department: str = "Department of Consumer Affairs (DoCA)"
    is_active: bool = True
    min_size_mm: float = 45.0
    max_undersized_tolerance_pct: float = 5.0
    max_rot_tolerance_pct: float = 2.0
    max_damage_tolerance_pct: float = 5.0
    max_sprout_tolerance_pct: float = 3.0
    max_total_defect_tolerance_pct: float = 10.0
    grade_a_definition: str
    urs_definition: str

class ProcurementRuleCreate(ProcurementRuleBase):
    pass

class ProcurementRuleResponse(ProcurementRuleBase):
    id: str
    effective_from: datetime
    created_at: datetime
    class Config:
        from_attributes = True

# Model Performance
class ModelArtifactResponse(BaseModel):
    id: str
    model_name: str
    version: str
    architecture: str
    dataset_version: str
    training_date: datetime
    evaluation_date: datetime
    precision: float
    recall: float
    f1_score: float
    map50: float
    map50_95: float
    is_production: bool
    confusion_matrix: Optional[Dict[str, Any]] = None
    per_class_metrics: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

# Audit Log
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    ip_address: str
    description: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    class Config:
        from_attributes = True
