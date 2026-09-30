from app.services.tamper_engine import tamper_engine
from app.services.storage_risk_engine import storage_risk_engine
from app.services.eval_engine import eval_engine
from app.models.models import ProcurementRule

def test_tamper_hash_integrity():
    hash1 = tamper_engine.generate_inspection_hash(
        lot_number="LOT-2026-TEST-001",
        inspection_number="INSP-001",
        inspector_id="insp-user-1",
        center_id="cnt-1",
        rule_version="v1.0.4",
        grade_result="GRADE_A",
        grade_a_pct=85.0,
        urs_pct=15.0,
        timestamp_iso="2026-09-30T10:00:00Z",
        counts_summary={"healthy": 40, "rotten": 1}
    )
    assert hash1.startswith("SHA256:")
    
    # Verify deterministic output
    hash2 = tamper_engine.generate_inspection_hash(
        lot_number="LOT-2026-TEST-001",
        inspection_number="INSP-001",
        inspector_id="insp-user-1",
        center_id="cnt-1",
        rule_version="v1.0.4",
        grade_result="GRADE_A",
        grade_a_pct=85.0,
        urs_pct=15.0,
        timestamp_iso="2026-09-30T10:00:00Z",
        counts_summary={"healthy": 40, "rotten": 1}
    )
    assert hash1 == hash2

def test_storage_risk_calculation():
    risk = storage_risk_engine.calculate_deterioration_risk(
        temperature_c=36.5,
        relative_humidity_pct=82.0,
        storage_days=25,
        rot_incidence_pct=5.2,
        sprouting_incidence_pct=2.0,
        weight_loss_pct=3.5,
        initial_grade="GRADE_A"
    )
    assert risk["risk_level"] == "HIGH"
    assert len(risk["primary_factors"]) > 0

def test_benchmark_metrics():
    bench = eval_engine.get_standard_benchmark_evaluation()
    assert bench["precision"] > 90.0
    assert bench["recall"] > 90.0
    assert "Healthy" in bench["per_class_metrics"]
    assert "Rotten" in bench["per_class_metrics"]
