import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False) # ADMINISTRATOR, INSPECTOR, SUPERVISOR, WAREHOUSE_OPERATOR, VIEWER
    center_id = Column(String(36), ForeignKey("procurement_centers.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    
    center = relationship("ProcurementCenter", back_populates="users")
    inspections = relationship("Inspection", back_populates="inspector", foreign_keys="Inspection.inspector_id")
    audit_logs = relationship("AuditLog", back_populates="user")


class ProcurementCenter(Base):
    __tablename__ = "procurement_centers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    state = Column(String(64), nullable=False)
    district = Column(String(64), nullable=False)
    address = Column(String(255), nullable=True)
    capacity_mt = Column(Float, default=500.0)
    created_at = Column(DateTime, default=utc_now)
    
    users = relationship("User", back_populates="center")
    lots = relationship("Lot", back_populates="center")
    inspections = relationship("Inspection", back_populates="center")


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    aadhaar_masked = Column(String(16), nullable=True)
    mandi_license = Column(String(64), nullable=True)
    location = Column(String(128), nullable=False)
    district = Column(String(64), nullable=False)
    state = Column(String(64), nullable=False)
    bank_account_masked = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    lots = relationship("Lot", back_populates="supplier")


class Lot(Base):
    __tablename__ = "lots"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lot_number = Column(String(64), unique=True, index=True, nullable=False)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    center_id = Column(String(36), ForeignKey("procurement_centers.id"), nullable=False)
    initial_quantity_mt = Column(Float, nullable=False)
    bag_count = Column(Integer, nullable=False)
    variety = Column(String(64), default="Nashik Red")
    harvested_date = Column(DateTime, nullable=True)
    arrival_date = Column(DateTime, default=utc_now)
    status = Column(String(32), default="PENDING_INSPECTION") # PENDING_INSPECTION, INSPECTED, REINSPECTION_REQUESTED, APPROVED, REJECTED, IN_STORAGE
    current_grade = Column(String(32), nullable=True) # GRADE_A, URS, REJECTED
    grade_a_percentage = Column(Float, nullable=True)
    urs_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    supplier = relationship("Supplier", back_populates="lots")
    center = relationship("ProcurementCenter", back_populates="lots")
    samples = relationship("Sample", back_populates="lot", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="lot", cascade="all, delete-orphan")
    passport = relationship("QualityPassport", back_populates="lot", uselist=False, cascade="all, delete-orphan")
    storage_readings = relationship("StorageReading", back_populates="lot", cascade="all, delete-orphan")
    reports = relationship("QualityReport", back_populates="lot", cascade="all, delete-orphan")


class Sample(Base):
    __tablename__ = "samples"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    sample_code = Column(String(64), unique=True, index=True, nullable=False)
    sample_weight_kg = Column(Float, nullable=False)
    sample_onion_count = Column(Integer, nullable=True)
    sampling_method = Column(String(64), default="Random 5-Bag Grid Cross-Section")
    bag_sample_locations = Column(String(255), default="Bags #1, #14, #28, #42, #55")
    inspector_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    lot = relationship("Lot", back_populates="samples")
    inspections = relationship("Inspection", back_populates="sample")


class ProcurementRule(Base):
    __tablename__ = "procurement_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    department = Column(String(128), default="Department of Consumer Affairs (DoCA)")
    is_active = Column(Boolean, default=True)
    min_size_mm = Column(Float, default=45.0) # Undersized if < 45mm for Grade A
    max_undersized_tolerance_pct = Column(Float, default=5.0)
    max_rot_tolerance_pct = Column(Float, default=2.0)
    max_damage_tolerance_pct = Column(Float, default=5.0)
    max_sprout_tolerance_pct = Column(Float, default=3.0)
    max_total_defect_tolerance_pct = Column(Float, default=10.0)
    grade_a_definition = Column(Text, default="Healthy sound bulbs >= 45mm with defects <= 10% aggregate and rot <= 2%")
    urs_definition = Column(Text, default="Under-sized / Under-grade onions acceptable under discounted procurement formula (40-44mm or aggregate defects 11-25%)")
    effective_from = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)
    
    inspections = relationship("Inspection", back_populates="rule_version")


class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inspection_number = Column(String(64), unique=True, index=True, nullable=False)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    sample_id = Column(String(36), ForeignKey("samples.id"), nullable=True)
    inspector_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    center_id = Column(String(36), ForeignKey("procurement_centers.id"), nullable=False)
    rule_version_id = Column(String(36), ForeignKey("procurement_rules.id"), nullable=False)
    status = Column(String(32), default="IN_PROGRESS") # IN_PROGRESS, AI_COMPLETED, REVIEW_REQUIRED, FINALIZED, REINSPECTED
    confidence_score = Column(Float, default=0.0) # Mean AI confidence
    grade_result = Column(String(32), nullable=True) # GRADE_A, URS, REJECTED, NEEDS_REINSPECTION
    grade_a_percentage = Column(Float, default=0.0)
    urs_percentage = Column(Float, default=0.0)
    total_detected_count = Column(Integer, default=0)
    healthy_count = Column(Integer, default=0)
    rotten_count = Column(Integer, default=0)
    damaged_count = Column(Integer, default=0)
    sprouted_count = Column(Integer, default=0)
    undersized_count = Column(Integer, default=0)
    needs_review_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    finalized_at = Column(DateTime, nullable=True)
    
    lot = relationship("Lot", back_populates="inspections")
    sample = relationship("Sample", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections", foreign_keys=[inspector_id])
    center = relationship("ProcurementCenter", back_populates="inspections")
    rule_version = relationship("ProcurementRule", back_populates="inspections")
    images = relationship("InspectionImage", back_populates="inspection", cascade="all, delete-orphan")
    weight_record = relationship("WeightRecord", back_populates="inspection", uselist=False, cascade="all, delete-orphan")
    reinspections = relationship("Reinspection", back_populates="original_inspection", foreign_keys="Reinspection.original_inspection_id")
    reports = relationship("QualityReport", back_populates="inspection")


class InspectionImage(Base):
    __tablename__ = "inspection_images"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inspection_id = Column(String(36), ForeignKey("inspections.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    blur_score = Column(Float, default=120.0) # Laplacian variance
    brightness_score = Column(Float, default=135.0) # Mean pixel value
    exposure_score = Column(Float, default=0.92) # Normal distribution score
    quality_status = Column(String(32), default="PASSED") # PASSED, BLURRED, LOW_LIGHT, OVEREXPOSED, OCCLUSION
    quality_guidance = Column(String(255), nullable=True)
    is_reinspection = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    
    inspection = relationship("Inspection", back_populates="images")
    detections = relationship("OnionDetection", back_populates="image", cascade="all, delete-orphan")


class OnionDetection(Base):
    __tablename__ = "onion_detections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inspection_image_id = Column(String(36), ForeignKey("inspection_images.id"), nullable=False)
    onion_index = Column(Integer, nullable=False)
    class_name = Column(String(32), nullable=False) # Healthy, Rotten, Damaged, Sprouted, Undersized
    confidence = Column(Float, nullable=False)
    bbox_x = Column(Float, nullable=False) # Normalized 0-1
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    diameter_mm = Column(Float, default=52.0)
    severity = Column(String(32), nullable=True) # Low, Medium, High / Minor, Moderate, Severe
    needs_review = Column(Boolean, default=False)
    inspector_override_class = Column(String(32), nullable=True)
    inspector_notes = Column(String(255), nullable=True)
    
    image = relationship("InspectionImage", back_populates="detections")


class WeightRecord(Base):
    __tablename__ = "weight_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inspection_id = Column(String(36), ForeignKey("inspections.id"), nullable=False)
    gross_sample_weight_kg = Column(Float, nullable=False)
    tare_weight_kg = Column(Float, default=0.25)
    net_sample_weight_kg = Column(Float, nullable=False)
    accepted_weight_kg = Column(Float, nullable=False)
    rejected_weight_kg = Column(Float, default=0.0)
    grade_a_weight_percentage = Column(Float, default=0.0)
    urs_weight_percentage = Column(Float, default=0.0)
    scale_device_type = Column(String(64), default="MANUAL_ENTRY") # MANUAL_ENTRY, BLUETOOTH_SCALE, SERIAL_COM, USB_SCALE
    scale_connected = Column(Boolean, default=False)
    recorded_at = Column(DateTime, default=utc_now)
    
    inspection = relationship("Inspection", back_populates="weight_record")


class Reinspection(Base):
    __tablename__ = "reinspections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reinspection_number = Column(String(64), unique=True, index=True, nullable=False)
    original_inspection_id = Column(String(36), ForeignKey("inspections.id"), nullable=False)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    inspector_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    supervisor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reason_code = Column(String(64), nullable=False) # SUPPLIER_DISPUTE, LOW_CONFIDENCE_BORDERLINE, ANOMALY_TRIGGER, SYSTEM_RANDOM_AUDIT
    reason_description = Column(Text, nullable=False)
    original_grade = Column(String(32), nullable=False)
    new_grade = Column(String(32), nullable=True)
    status = Column(String(32), default="PENDING_REVIEW") # PENDING_REVIEW, APPROVED_NEW_GRADE, UPHELD_ORIGINAL, REJECTED
    supervisor_decision = Column(String(64), nullable=True)
    supervisor_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    finalized_at = Column(DateTime, nullable=True)
    
    original_inspection = relationship("Inspection", back_populates="reinspections", foreign_keys=[original_inspection_id])


class QualityPassport(Base):
    __tablename__ = "quality_passports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    passport_uuid = Column(String(64), unique=True, index=True, nullable=False)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    qr_code_payload = Column(Text, nullable=False)
    tamper_hash = Column(String(64), nullable=False) # SHA-256
    grade_classification = Column(String(32), nullable=False)
    grade_a_pct = Column(Float, nullable=False)
    urs_pct = Column(Float, nullable=False)
    is_locked = Column(Boolean, default=True)
    verified_at = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, default=utc_now)
    
    lot = relationship("Lot", back_populates="passport")


class StorageReading(Base):
    __tablename__ = "storage_readings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    center_id = Column(String(36), ForeignKey("procurement_centers.id"), nullable=False)
    warehouse_bay = Column(String(32), default="Bay-C04")
    temperature_c = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    rot_incidence_pct = Column(Float, default=0.0)
    sprouting_incidence_pct = Column(Float, default=0.0)
    weight_loss_pct = Column(Float, default=0.0)
    deterioration_risk_level = Column(String(32), default="LOW") # LOW, MEDIUM, HIGH
    risk_factors_json = Column(JSON, nullable=True)
    recorded_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=utc_now)
    
    lot = relationship("Lot", back_populates="storage_readings")


class QualityReport(Base):
    __tablename__ = "quality_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_number = Column(String(64), unique=True, index=True, nullable=False)
    inspection_id = Column(String(36), ForeignKey("inspections.id"), nullable=False)
    lot_id = Column(String(36), ForeignKey("lots.id"), nullable=False)
    report_hash = Column(String(64), nullable=False) # Cryptographic checksum
    generated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    doc_type = Column(String(32), default="OFFICIAL_CERTIFICATE")
    pdf_path = Column(String(255), nullable=True)
    rule_version_name = Column(String(128), nullable=False)
    is_tamper_verified = Column(Boolean, default=True)
    generated_at = Column(DateTime, default=utc_now)
    
    lot = relationship("Lot", back_populates="reports")
    inspection = relationship("Inspection", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(64), nullable=False) # LOT_CREATED, INSPECTION_ANALYZED, OVERRIDE_DEFECT, REINSPECTION_SUBMITTED, PASSPORT_GENERATED, RULE_CHANGED
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    ip_address = Column(String(64), default="127.0.0.1")
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="audit_logs")


class ModelArtifact(Base):
    __tablename__ = "model_artifacts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(128), nullable=False)
    version = Column(String(32), unique=True, nullable=False)
    architecture = Column(String(64), default="YOLOv8-Seg + ResNet Feature Defect Head")
    dataset_version = Column(String(32), default="ONION-CV-V2.4")
    training_date = Column(DateTime, default=utc_now)
    evaluation_date = Column(DateTime, default=utc_now)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    map50 = Column(Float, nullable=False)
    map50_95 = Column(Float, nullable=False)
    is_production = Column(Boolean, default=False)
    artifact_path = Column(String(255), default="./models/pyaaz_v2.4.onnx")
    confusion_matrix_json = Column(JSON, nullable=True)
    per_class_metrics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    version = Column(String(32), unique=True, nullable=False)
    sample_count = Column(Integer, default=4500)
    class_distribution_json = Column(JSON, nullable=True)
    train_split_pct = Column(Float, default=70.0)
    val_split_pct = Column(Float, default=15.0)
    test_split_pct = Column(Float, default=15.0)
    created_at = Column(DateTime, default=utc_now)
