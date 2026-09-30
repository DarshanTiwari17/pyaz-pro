from typing import Dict, Any, List
from app.models.models import ProcurementRule

class GradingEngine:
    """
    Configurable Procurement Rules Engine conforming to Dept. of Consumer Affairs (DoCA)
    and Agmarknet Onion Quality Grading Standards.
    
    Transforms AI physical characteristics and scale weight data into legally transparent
    procurement classifications (Grade A, URS - Under-sized/Under-grade, or Rejection).
    """

    @staticmethod
    def evaluate_lot(
        rule: ProcurementRule,
        total_count: int,
        healthy_count: int,
        rotten_count: int,
        damaged_count: int,
        sprouted_count: int,
        undersized_count: int,
        gross_weight_kg: float = 0.0,
        accepted_weight_kg: float = 0.0,
        rejected_weight_kg: float = 0.0
    ) -> Dict[str, Any]:
        """
        Evaluates inspection counts and weights against specified rule parameters.
        Returns clear Grade A %, URS %, and an auditable decision tree explanation.
        """
        if total_count == 0:
            return {
                "grade": "PENDING_ASSESSMENT",
                "grade_a_percentage": 0.0,
                "urs_percentage": 0.0,
                "rejection_percentage": 0.0,
                "is_conforming": False,
                "rule_version_applied": rule.version if rule else "DOCA-2026-V1.0",
                "decision_tree": ["No sample count provided for evaluation."],
                "tolerances_exceeded": []
            }

        # Percentage calculations
        healthy_pct = (healthy_count / total_count) * 100.0
        rotten_pct = (rotten_count / total_count) * 100.0
        damaged_pct = (damaged_count / total_count) * 100.0
        sprouted_pct = (sprouted_count / total_count) * 100.0
        undersized_pct = (undersized_count / total_count) * 100.0
        total_defects_pct = rotten_pct + damaged_pct + sprouted_pct + undersized_pct

        tolerances_exceeded = []
        decision_tree = []

        decision_tree.append(f"Applied Rule Standard: {rule.name} ({rule.version})")
        decision_tree.append(f"Sample Size Evaluated: {total_count} bulbs ({healthy_count} Healthy, {undersized_count} Undersized, {rotten_count} Rotten, {damaged_count} Damaged, {sprouted_count} Sprouted)")

        # Tolerance checks
        if rotten_pct > rule.max_rot_tolerance_pct:
            tolerances_exceeded.append(f"Rot/Decay ({rotten_pct:.1f}%) exceeds maximum limit ({rule.max_rot_tolerance_pct:.1f}%)")
        
        if damaged_pct > rule.max_damage_tolerance_pct:
            tolerances_exceeded.append(f"Mechanical Damage ({damaged_pct:.1f}%) exceeds standard tolerance ({rule.max_damage_tolerance_pct:.1f}%)")
            
        if sprouted_pct > rule.max_sprout_tolerance_pct:
            tolerances_exceeded.append(f"Sprouting ({sprouted_pct:.1f}%) exceeds standard tolerance ({rule.max_sprout_tolerance_pct:.1f}%)")
            
        if undersized_pct > rule.max_undersized_tolerance_pct:
            tolerances_exceeded.append(f"Undersized (<{rule.min_size_mm}mm) ratio ({undersized_pct:.1f}%) exceeds Grade A tolerance ({rule.max_undersized_tolerance_pct:.1f}%)")

        # Grading logic decision
        # 1. Total Rejection criteria: High rot (> 5%) or catastrophic aggregate defects (> 30%)
        if rotten_pct > 5.0 or (rotten_pct + damaged_pct + sprouted_pct) > 25.0:
            final_grade = "REJECTED"
            grade_a_pct = 0.0
            urs_pct = 0.0
            rejection_pct = 100.0
            decision_tree.append(f"CLASSIFICATION: LOT REJECTED due to critical decay/disease levels exceeding safety threshold.")
            
        # 2. Grade A criteria: Meets tight tolerances
        elif len(tolerances_exceeded) == 0:
            final_grade = "GRADE_A"
            grade_a_pct = round(healthy_pct, 1)
            urs_pct = round(100.0 - grade_a_pct, 1)
            rejection_pct = 0.0
            decision_tree.append(f"CLASSIFICATION: GRADE A APPROVED. Lot strictly satisfies all DoCA Agmarknet Grade A tolerances.")
            
        # 3. URS (Under-grade / Fair Average Quality) criteria
        else:
            final_grade = "URS"
            grade_a_pct = round(max(0.0, healthy_pct - undersized_pct), 1)
            urs_pct = round(min(100.0, undersized_pct + damaged_pct * 0.8 + sprouted_pct * 0.8), 1)
            rejection_pct = round(max(0.0, 100.0 - grade_a_pct - urs_pct), 1)
            decision_tree.append(f"CLASSIFICATION: URS (Under-sized / Discounted Category) ASSIGNED. Non-critical defects permitted under fair procurement pricing.")

        # Weight-based verification reconciliation
        weight_metrics = {}
        if gross_weight_kg > 0:
            net_sample_wt = max(0.1, accepted_weight_kg + rejected_weight_kg)
            wt_accepted_pct = round((accepted_weight_kg / net_sample_wt) * 100.0, 1)
            wt_rejected_pct = round((rejected_weight_kg / net_sample_wt) * 100.0, 1)
            weight_metrics = {
                "gross_weight_kg": gross_weight_kg,
                "accepted_weight_kg": accepted_weight_kg,
                "rejected_weight_kg": rejected_weight_kg,
                "accepted_weight_pct": wt_accepted_pct,
                "rejected_weight_pct": wt_rejected_pct
            }
            decision_tree.append(f"Weight Verification: {accepted_weight_kg:.2f} kg Accepted ({wt_accepted_pct}%), {rejected_weight_kg:.2f} kg Rejected ({wt_rejected_pct}%).")

        return {
            "grade": final_grade,
            "grade_a_percentage": grade_a_pct,
            "urs_percentage": urs_pct,
            "rejection_percentage": rejection_pct,
            "is_conforming": final_grade == "GRADE_A",
            "rule_version_applied": f"{rule.name} ({rule.version})",
            "rule_id": rule.id,
            "decision_tree": decision_tree,
            "tolerances_exceeded": tolerances_exceeded,
            "metrics": {
                "count_healthy_pct": round(healthy_pct, 1),
                "count_undersized_pct": round(undersized_pct, 1),
                "count_rotten_pct": round(rotten_pct, 1),
                "count_damaged_pct": round(damaged_pct, 1),
                "count_sprouted_pct": round(sprouted_pct, 1),
                "count_total_defects_pct": round(total_defects_pct, 1)
            },
            "weight_metrics": weight_metrics
        }

grading_engine = GradingEngine()
