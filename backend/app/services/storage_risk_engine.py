from datetime import datetime, timezone
from typing import Dict, Any, List

class StorageRiskEngine:
    """
    Post-Procurement Onion Storage Quality & Spoilage Kinetic Risk Model.
    Evaluates temperature, relative humidity (RH), days in storage, rot escalation,
    and sprouting onset against post-harvest storage physiological thresholds.
    """

    # Optimal storage ranges for cured onions in ventilated buffer godowns:
    # Temperature: 25-30°C with dry airflow OR cold storage at 0-2°C
    # Relative Humidity: 65-70% (RH > 75% dramatically accelerates fungal Aspergillus/Botrytis neck rot)
    # RH < 60% causes excessive bulb shrinkage/weight loss.
    
    @staticmethod
    def calculate_deterioration_risk(
        temperature_c: float,
        relative_humidity_pct: float,
        storage_days: int,
        rot_incidence_pct: float,
        sprouting_incidence_pct: float,
        weight_loss_pct: float,
        initial_grade: str = "GRADE_A"
    ) -> Dict[str, Any]:
        """
        Calculates multi-factor storage deterioration risk and provides explainable drivers.
        """
        risk_score = 0 # Out of 100
        risk_factors: List[str] = []
        actionable_recommendations: List[str] = []

        # 1. Temperature Stress Evaluation
        if temperature_c > 35.0:
            risk_score += 30
            risk_factors.append(f"Critical ambient heat ({temperature_c}°C > 35°C): accelerates black mold (Aspergillus niger) and enzyme respiration.")
            actionable_recommendations.append("Activate warehouse forced-air turbo ventilation during cooler night hours.")
        elif temperature_c > 30.0:
            risk_score += 15
            risk_factors.append(f"Elevated temperature ({temperature_c}°C): moderate acceleration of bulb respiration.")
            actionable_recommendations.append("Ensure aeration louvers are fully open.")
        elif 10.0 <= temperature_c <= 20.0:
            # Temperature zone of 10-20°C strongly breaks bulb dormancy and induces sprouting!
            risk_score += 25
            risk_factors.append(f"Dormancy break temperature zone ({temperature_c}°C): triggers rapid apical bud sprouting.")
            actionable_recommendations.append("Avoid ambient holding at 10-18°C; maintain either warm dry airflow (>25°C) or cold chain (<2°C).")

        # 2. Relative Humidity (RH) Stress Evaluation
        if relative_humidity_pct > 80.0:
            risk_score += 35
            risk_factors.append(f"Dangerous humidity ({relative_humidity_pct}% > 80%): rapid condensation leading to neck rot and bacterial soft rot.")
            actionable_recommendations.append("Operate industrial dehumidifiers and exhaust fans immediately to prevent surface condensation.")
        elif relative_humidity_pct > 75.0:
            risk_score += 20
            risk_factors.append(f"High humidity ({relative_humidity_pct}% > 75%): moist outer scales favor fungal spore germination.")
            actionable_recommendations.append("Increase bottom-up air circulation across stack pallets.")
        elif relative_humidity_pct < 55.0:
            risk_score += 10
            risk_factors.append(f"Excessively dry air ({relative_humidity_pct}% < 55%): accelerates outer tunic peeling and desiccation weight loss.")

        # 3. Direct Biological Symptom Progression
        if rot_incidence_pct > 4.0:
            risk_score += 35
            risk_factors.append(f"Active rot decay detected ({rot_incidence_pct:.1f}%): risk of cross-contamination to neighboring bags.")
            actionable_recommendations.append("Initiate immediate spot sorting and cull infected bags to quarantine stack.")
        elif rot_incidence_pct > 1.5:
            risk_score += 15
            risk_factors.append(f"Low-level rot incidence detected ({rot_incidence_pct:.1f}%).")
            
        if sprouting_incidence_pct > 3.0:
            risk_score += 25
            risk_factors.append(f"Sprouting progression ({sprouting_incidence_pct:.1f}%): loss of bulb firmness and commercial downgrade.")
            actionable_recommendations.append("Prioritize this lot for immediate market release/procurement distribution.")
        elif sprouting_incidence_pct > 1.0:
            risk_score += 10
            risk_factors.append(f"Initial sprouting shoots observed ({sprouting_incidence_pct:.1f}%).")

        # 4. Storage Duration & Weight Loss Accumulation
        if storage_days > 45:
            risk_score += 15
            risk_factors.append(f"Extended holding duration ({storage_days} days): natural senescent decay phase.")
        elif storage_days > 30:
            risk_score += 8
            
        if weight_loss_pct > 6.0:
            risk_score += 15
            risk_factors.append(f"High moisture shrinkage ({weight_loss_pct:.1f}% weight loss).")

        # Initial quality baseline adjustment
        if initial_grade == "URS":
            risk_score += 10
            risk_factors.append("Initial lot contained under-grade/minor defects with higher baseline susceptibility.")

        # Normalize score
        risk_score = min(100, max(0, risk_score))

        # Risk Classification
        if risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if not risk_factors:
            risk_factors.append("Storage microclimate parameters are within optimal preservation thresholds.")
            actionable_recommendations.append("Maintain routine weekly sensor checks.")

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "storage_days": storage_days,
            "primary_factors": risk_factors,
            "actionable_recommendations": actionable_recommendations,
            "evaluation_timestamp": datetime.now(timezone.utc).isoformat()
        }

storage_risk_engine = StorageRiskEngine()
