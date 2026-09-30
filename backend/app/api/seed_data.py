from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    User, ProcurementCenter, Supplier, Lot, Sample, ProcurementRule,
    Inspection, InspectionImage, OnionDetection, WeightRecord, Reinspection,
    QualityPassport, StorageReading, QualityReport, AuditLog, ModelArtifact, Dataset
)
from app.core.security import get_password_hash
from app.services.tamper_engine import tamper_engine
from app.services.storage_risk_engine import storage_risk_engine
from app.services.eval_engine import eval_engine

async def seed_database(db: AsyncSession):
    # Check if already seeded
    existing_user = await db.execute(select(User).limit(1))
    if existing_user.scalars().first():
        return # already seeded

    now = datetime.now(timezone.utc)
    
    # 1. Procurement Centers
    center_lasalgaon = ProcurementCenter(
        code="MH-NSK-LAS-01",
        name="Lasalgaon APMC Procurement Terminal",
        state="Maharashtra",
        district="Nashik",
        address="APMC Yard, Lasalgaon, Taluka Niphad, Nashik - 422306",
        capacity_mt=1200.0,
        created_at=now - timedelta(days=60)
    )
    center_pimpalgaon = ProcurementCenter(
        code="MH-NSK-PMP-02",
        name="Pimpalgaon Baswant Buffer Center",
        state="Maharashtra",
        district="Nashik",
        address="National Highway 3, Pimpalgaon Baswant - 422209",
        capacity_mt=1500.0,
        created_at=now - timedelta(days=60)
    )
    center_mahuva = ProcurementCenter(
        code="GJ-BHV-MHV-01",
        name="Mahuva Mandi Intake Yard",
        state="Gujarat",
        district="Bhavnagar",
        address="Market Yard, Mahuva - 364290",
        capacity_mt=900.0,
        created_at=now - timedelta(days=45)
    )
    
    db.add_all([center_lasalgaon, center_pimpalgaon, center_mahuva])
    await db.flush()

    # 2. Users with strict roles
    users = [
        User(
            username="admin",
            email="admin@doca.gov.in",
            full_name="Rajesh Verma (Chief Admin)",
            hashed_password=get_password_hash("admin123"),
            role="ADMINISTRATOR",
            center_id=center_lasalgaon.id,
            created_at=now - timedelta(days=60)
        ),
        User(
            username="inspector_sharma",
            email="s.sharma@pyaazpro.gov.in",
            full_name="Sanjay Sharma (Senior Quality Inspector)",
            hashed_password=get_password_hash("inspector123"),
            role="INSPECTOR",
            center_id=center_lasalgaon.id,
            created_at=now - timedelta(days=40)
        ),
        User(
            username="supervisor_patil",
            email="a.patil@pyaazpro.gov.in",
            full_name="Anand Patil (Regional Procurement Supervisor)",
            hashed_password=get_password_hash("supervisor123"),
            role="SUPERVISOR",
            center_id=center_lasalgaon.id,
            created_at=now - timedelta(days=50)
        ),
        User(
            username="warehouse_ramesh",
            email="ramesh.w@pyaazpro.gov.in",
            full_name="Ramesh Deshmukh (Godown & Cold Storage Officer)",
            hashed_password=get_password_hash("warehouse123"),
            role="WAREHOUSE_OPERATOR",
            center_id=center_pimpalgaon.id,
            created_at=now - timedelta(days=30)
        ),
        User(
            username="viewer_auditor",
            email="auditor.cag@nic.in",
            full_name="Pooja Kulkarni (Quality Auditor)",
            hashed_password=get_password_hash("viewer123"),
            role="VIEWER",
            center_id=None,
            created_at=now - timedelta(days=20)
        )
    ]
    db.add_all(users)
    await db.flush()

    # 3. Procurement Rules
    rule_doca_2026 = ProcurementRule(
        rule_code="DOCA-2026-V1.0",
        name="DoCA National Buffer Onion Procurement Standard (Agmarknet 2026)",
        version="v1.0.4",
        department="Department of Consumer Affairs (DoCA)",
        is_active=True,
        min_size_mm=45.0,
        max_undersized_tolerance_pct=5.0,
        max_rot_tolerance_pct=2.0,
        max_damage_tolerance_pct=5.0,
        max_sprout_tolerance_pct=3.0,
        max_total_defect_tolerance_pct=10.0,
        grade_a_definition="Sound dry red/yellow bulbs >= 45mm diameter, rot <= 2%, total defects <= 10%",
        urs_definition="Under-sized / Under-grade onions acceptable under price deduction formula (40-44mm or total defects 10.1-25%)",
        effective_from=now - timedelta(days=90),
        created_at=now - timedelta(days=90)
    )
    db.add(rule_doca_2026)
    await db.flush()

    # 4. Suppliers
    sup1 = Supplier(
        code="SUP-MH-0842",
        name="Rameshwar Farmer Producer Company",
        phone="+91 98234 11200",
        aadhaar_masked="XXXX-XXXX-4921",
        mandi_license="MH/NSK/APMC/2022/994",
        location="Village Vinchur, Niphad",
        district="Nashik",
        state="Maharashtra",
        bank_account_masked="SBI-XXXX-8821"
    )
    sup2 = Supplier(
        code="SUP-MH-0193",
        name="Godavari Krishi Sahakari Mandali",
        phone="+91 94222 45871",
        aadhaar_masked="XXXX-XXXX-8104",
        mandi_license="MH/NSK/APMC/2019/312",
        location="Pimpalgaon Baswant",
        district="Nashik",
        state="Maharashtra",
        bank_account_masked="HDFC-XXXX-3342"
    )
    sup3 = Supplier(
        code="SUP-GJ-0518",
        name="Saurashtra White & Red Onion FPO",
        phone="+91 97255 90123",
        aadhaar_masked="XXXX-XXXX-1933",
        mandi_license="GJ/BHV/APMC/2021/418",
        location="Talaja Road, Mahuva",
        district="Bhavnagar",
        state="Gujarat",
        bank_account_masked="BOB-XXXX-7109"
    )
    db.add_all([sup1, sup2, sup3])
    await db.flush()

    # 5. Lots
    lot1 = Lot(
        lot_number="LOT-2026-NSK-00101",
        supplier_id=sup1.id,
        center_id=center_lasalgaon.id,
        initial_quantity_mt=24.5,
        bag_count=490,
        variety="Garwa Nashik Red",
        harvested_date=now - timedelta(days=12),
        arrival_date=now - timedelta(days=2),
        status="APPROVED",
        current_grade="GRADE_A",
        grade_a_percentage=84.5,
        urs_percentage=15.5,
        created_at=now - timedelta(days=2)
    )
    lot2 = Lot(
        lot_number="LOT-2026-NSK-00102",
        supplier_id=sup2.id,
        center_id=center_lasalgaon.id,
        initial_quantity_mt=18.0,
        bag_count=360,
        variety="Pol Onion (Late Kharif)",
        harvested_date=now - timedelta(days=8),
        arrival_date=now - timedelta(days=1),
        status="APPROVED",
        current_grade="URS",
        grade_a_percentage=68.2,
        urs_percentage=31.8,
        created_at=now - timedelta(days=1)
    )
    lot3 = Lot(
        lot_number="LOT-2026-PMP-00204",
        supplier_id=sup1.id,
        center_id=center_pimpalgaon.id,
        initial_quantity_mt=32.0,
        bag_count=640,
        variety="Nashik Agri Red",
        harvested_date=now - timedelta(days=18),
        arrival_date=now - timedelta(days=14),
        status="IN_STORAGE",
        current_grade="GRADE_A",
        grade_a_percentage=88.0,
        urs_percentage=12.0,
        created_at=now - timedelta(days=14)
    )
    lot4 = Lot(
        lot_number="LOT-2026-MHV-00309",
        supplier_id=sup3.id,
        center_id=center_mahuva.id,
        initial_quantity_mt=28.0,
        bag_count=560,
        variety="Mahuva Red Globe",
        harvested_date=now - timedelta(days=5),
        arrival_date=now - timedelta(hours=8),
        status="REINSPECTION_REQUESTED",
        current_grade="URS",
        grade_a_percentage=72.0,
        urs_percentage=28.0,
        created_at=now - timedelta(hours=8)
    )
    
    db.add_all([lot1, lot2, lot3, lot4])
    await db.flush()

    # 6. Samples & Inspections for Lot 1
    sample1 = Sample(
        lot_id=lot1.id,
        sample_code="SMP-2026-00101-A",
        sample_weight_kg=12.5,
        sample_onion_count=65,
        sampling_method="Random 5-Bag Grid Cross-Section",
        bag_sample_locations="Bags #12, #84, #195, #320, #475",
        inspector_id=users[1].id,
        created_at=now - timedelta(days=2, hours=1)
    )
    db.add(sample1)
    await db.flush()

    insp1 = Inspection(
        inspection_number="INSP-2026-00841",
        lot_id=lot1.id,
        sample_id=sample1.id,
        inspector_id=users[1].id,
        center_id=center_lasalgaon.id,
        rule_version_id=rule_doca_2026.id,
        status="FINALIZED",
        confidence_score=0.94,
        grade_result="GRADE_A",
        grade_a_percentage=84.5,
        urs_percentage=15.5,
        total_detected_count=65,
        healthy_count=55,
        rotten_count=1,
        damaged_count=3,
        sprouted_count=2,
        undersized_count=4,
        needs_review_count=1,
        notes="High quality dry cured bulbs with uniform size distribution. Clean root disc.",
        created_at=now - timedelta(days=2),
        finalized_at=now - timedelta(days=2)
    )
    db.add(insp1)
    await db.flush()

    # Inspection Image & Detections
    img1 = InspectionImage(
        inspection_id=insp1.id,
        image_path="/storage/uploads/insp_sample_00841.jpg",
        original_filename="sample_tray_lasalgaon_01.jpg",
        width=1920,
        height=1080,
        blur_score=156.4,
        brightness_score=142.0,
        exposure_score=0.96,
        quality_status="PASSED",
        quality_guidance="Optimal lighting and focus parameters verified.",
        is_reinspection=False
    )
    db.add(img1)
    await db.flush()

    # Detections for img1
    detections_data = [
        (1, "Healthy", 0.97, 0.15, 0.20, 0.14, 0.22, 56.4, None, False),
        (2, "Healthy", 0.96, 0.32, 0.18, 0.13, 0.21, 54.1, None, False),
        (3, "Rotten", 0.92, 0.50, 0.22, 0.14, 0.22, 51.0, "Low", False),
        (4, "Healthy", 0.95, 0.68, 0.19, 0.15, 0.24, 58.2, None, False),
        (5, "Damaged", 0.89, 0.16, 0.52, 0.14, 0.21, 52.8, "Minor", False),
        (6, "Sprouted", 0.94, 0.34, 0.55, 0.13, 0.20, 49.5, "Small", False),
        (7, "Undersized", 0.96, 0.52, 0.53, 0.10, 0.16, 41.8, "41.8mm (< 45mm)", False),
        (8, "Healthy", 0.95, 0.70, 0.51, 0.15, 0.23, 57.0, None, False),
    ]
    for idx, cls_name, conf, bx, by, bw, bh, dia, sev, nr in detections_data:
        det = OnionDetection(
            inspection_image_id=img1.id,
            onion_index=idx,
            class_name=cls_name,
            confidence=conf,
            bbox_x=bx,
            bbox_y=by,
            bbox_w=bw,
            bbox_h=bh,
            diameter_mm=dia,
            severity=sev,
            needs_review=nr
        )
        db.add(det)

    # Weight Record for Insp1
    wt1 = WeightRecord(
        inspection_id=insp1.id,
        gross_sample_weight_kg=12.50,
        tare_weight_kg=0.25,
        net_sample_weight_kg=12.25,
        accepted_weight_kg=10.35,
        rejected_weight_kg=1.90,
        grade_a_weight_percentage=84.5,
        urs_weight_percentage=15.5,
        scale_device_type="DIGITAL_LOAD_CELL_COM3",
        scale_connected=True,
        recorded_at=now - timedelta(days=2)
    )
    db.add(wt1)

    # SHA-256 Tamper Hash & Quality Passport
    t_hash1 = tamper_engine.generate_inspection_hash(
        lot_number=lot1.lot_number,
        inspection_number=insp1.inspection_number,
        inspector_id=users[1].id,
        center_id=center_lasalgaon.id,
        rule_version=rule_doca_2026.version,
        grade_result="GRADE_A",
        grade_a_pct=84.5,
        urs_pct=15.5,
        timestamp_iso=insp1.created_at.isoformat(),
        counts_summary={"healthy": 55, "rotten": 1, "damaged": 3, "sprouted": 2, "undersized": 4}
    )

    qr_payload1 = tamper_engine.create_qr_payload(
        passport_uuid=lot1.id,
        lot_number=lot1.lot_number,
        grade="GRADE_A",
        grade_a_pct=84.5,
        center_code=center_lasalgaon.code,
        tamper_hash=t_hash1
    )

    passport1 = QualityPassport(
        passport_uuid=f"QP-2026-NSK-{lot1.lot_number[-5:]}",
        lot_id=lot1.id,
        qr_code_payload=qr_payload1,
        tamper_hash=t_hash1,
        grade_classification="GRADE_A",
        grade_a_pct=84.5,
        urs_pct=15.5,
        is_locked=True,
        verified_at=now - timedelta(days=1),
        generated_at=now - timedelta(days=2)
    )
    db.add(passport1)

    report1 = QualityReport(
        report_number="REP-DOCA-2026-00841",
        inspection_id=insp1.id,
        lot_id=lot1.id,
        report_hash=t_hash1,
        generated_by_id=users[1].id,
        doc_type="OFFICIAL_CERTIFICATE",
        rule_version_name=f"{rule_doca_2026.name} ({rule_doca_2026.version})",
        is_tamper_verified=True,
        generated_at=now - timedelta(days=2)
    )
    db.add(report1)

    # 7. Reinspection record for Lot 4 (Dispute workflow)
    insp4 = Inspection(
        inspection_number="INSP-2026-00912",
        lot_id=lot4.id,
        sample_id=None,
        inspector_id=users[1].id,
        center_id=center_mahuva.id,
        rule_version_id=rule_doca_2026.id,
        status="REINSPECTED",
        confidence_score=0.88,
        grade_result="URS",
        grade_a_percentage=72.0,
        urs_percentage=28.0,
        total_detected_count=50,
        healthy_count=36,
        rotten_count=2,
        damaged_count=4,
        sprouted_count=1,
        undersized_count=7,
        needs_review_count=3,
        notes="Borderline undersized classification disputed by FPO representative.",
        created_at=now - timedelta(hours=8)
    )
    db.add(insp4)
    await db.flush()

    reinsp4 = Reinspection(
        reinspection_number="REINSP-2026-00042",
        original_inspection_id=insp4.id,
        lot_id=lot4.id,
        inspector_id=users[1].id,
        supervisor_id=users[2].id,
        reason_code="SUPPLIER_DISPUTE",
        reason_description="Farmer representative contends that calibrated camera boundary counted tapered neck as undersized bulb diameter.",
        original_grade="URS",
        new_grade=None,
        status="PENDING_REVIEW",
        supervisor_decision=None,
        supervisor_remarks="Scheduled for secondary caliper verification and 10-bag re-sampling with supervisor present.",
        created_at=now - timedelta(hours=6)
    )
    db.add(reinsp4)
    await db.flush()

    # 8. Storage Readings for Buffer Lot 3 (Lot in Storage)
    for day_offset, temp, rh, rot, sprout, wt_loss in [
        (14, 26.5, 66.0, 0.2, 0.0, 0.5),
        (10, 27.2, 68.5, 0.4, 0.1, 1.2),
        (7,  28.8, 72.0, 0.8, 0.3, 2.1),
        (3,  31.4, 76.5, 1.6, 0.8, 3.4),
        (0,  33.2, 79.0, 2.4, 1.4, 4.2),
    ]:
        reading_time = now - timedelta(days=day_offset)
        risk = storage_risk_engine.calculate_deterioration_risk(
            temperature_c=temp,
            relative_humidity_pct=rh,
            storage_days=14 - day_offset,
            rot_incidence_pct=rot,
            sprouting_incidence_pct=sprout,
            weight_loss_pct=wt_loss,
            initial_grade="GRADE_A"
        )
        storage_rec = StorageReading(
            lot_id=lot3.id,
            center_id=center_pimpalgaon.id,
            warehouse_bay="ColdBay-N03",
            temperature_c=temp,
            relative_humidity_pct=rh,
            rot_incidence_pct=rot,
            sprouting_incidence_pct=sprout,
            weight_loss_pct=wt_loss,
            deterioration_risk_level=risk["risk_level"],
            risk_factors_json=risk,
            recorded_by_id=users[3].id,
            recorded_at=reading_time
        )
        db.add(storage_rec)

    # 9. Model Artifact & Benchmark Evaluation
    bench = eval_engine.get_standard_benchmark_evaluation()
    model_art = ModelArtifact(
        model_name="PYAAZ-CV-OnionNet-v2.4",
        version="v2.4.1",
        architecture="YOLOv8x-Seg Backbone + Spatial Scale Calibrator",
        dataset_version="DOCA-BENCHMARK-TEST-2026",
        training_date=now - timedelta(days=35),
        evaluation_date=now - timedelta(days=15),
        precision=bench["precision"],
        recall=bench["recall"],
        f1_score=bench["f1_score"],
        map50=bench["map50"],
        map50_95=bench["map50_95"],
        is_production=True,
        artifact_path="./models/pyaaz_v2.4.onnx",
        confusion_matrix_json=bench["confusion_matrix"],
        per_class_metrics_json=bench["per_class_metrics"],
        created_at=now - timedelta(days=35)
    )
    db.add(model_art)

    dataset_benchmark = Dataset(
        name="DoCA Multi-Mandi Ground Truth Test Benchmark",
        version="DOCA-BENCHMARK-TEST-2026",
        sample_count=4500,
        class_distribution_json={"Healthy": 2200, "Rotten": 750, "Damaged": 680, "Sprouted": 420, "Undersized": 450},
        train_split_pct=70.0,
        val_split_pct=15.0,
        test_split_pct=15.0,
        created_at=now - timedelta(days=40)
    )
    db.add(dataset_benchmark)

    # 10. Audit Logs
    audit_events = [
        ("RULE_UPDATED", "ProcurementRule", rule_doca_2026.id, users[0].id, "Activated standard Agmarknet 2026 buffer rule version v1.0.4"),
        ("INSPECTION_FINALIZED", "Inspection", insp1.id, users[1].id, "Finalized inspection INSP-2026-00841. Result: Grade A (84.5%). SHA-256 seal generated."),
        ("PASSPORT_LOCKED", "QualityPassport", passport1.id, users[1].id, "Locked Quality Passport QP-2026-NSK-00101 with verified QR payload."),
        ("REINSPECTION_FILED", "Reinspection", reinsp4.id, users[1].id, "Filed reinspection dispute for LOT-2026-MHV-00309 upon supplier request.")
    ]
    for action, etype, eid, uid, desc in audit_events:
        db.add(AuditLog(
            user_id=uid,
            action=action,
            entity_type=etype,
            entity_id=eid,
            ip_address="192.168.1.140",
            description=desc,
            metadata_json={"source": "PYAAZ-PRO-PROD-PORTAL"},
            created_at=now - timedelta(hours=12)
        ))

    await db.commit()
