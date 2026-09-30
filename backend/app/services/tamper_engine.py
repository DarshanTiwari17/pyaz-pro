import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class TamperEvidenceEngine:
    """
    Cryptographic Tamper-Evidence & Integrity Verification Engine.
    Generates immutable SHA-256 digital seals for Inspection Certificates and Quality Passports.
    """

    @staticmethod
    def generate_inspection_hash(
        lot_number: str,
        inspection_number: str,
        inspector_id: str,
        center_id: str,
        rule_version: str,
        grade_result: str,
        grade_a_pct: float,
        urs_pct: float,
        timestamp_iso: str,
        counts_summary: Dict[str, int]
    ) -> str:
        """
        Creates a deterministic SHA-256 checksum seal over inspection data.
        """
        payload = {
            "lot_number": str(lot_number),
            "inspection_number": str(inspection_number),
            "inspector_id": str(inspector_id),
            "center_id": str(center_id),
            "rule_version": str(rule_version),
            "grade_result": str(grade_result),
            "grade_a_pct": round(float(grade_a_pct), 2),
            "urs_pct": round(float(urs_pct), 2),
            "timestamp": str(timestamp_iso),
            "counts": counts_summary
        }
        
        canonical_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        sha = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        return f"SHA256:{sha}"

    @staticmethod
    def verify_inspection_hash(stored_hash: str, payload_data: Dict[str, Any]) -> bool:
        """
        Verifies if an inspection record or certificate has maintained tamper integrity.
        """
        if not stored_hash or not stored_hash.startswith("SHA256:"):
            return False
            
        canonical_json = json.dumps(payload_data, sort_keys=True, separators=(",", ":"))
        computed_sha = f"SHA256:{hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()}"
        return computed_sha == stored_hash

    @staticmethod
    def create_qr_payload(passport_uuid: str, lot_number: str, grade: str, grade_a_pct: float, center_code: str, tamper_hash: str) -> str:
        """
        Constructs standardized QR payload for public and mandi stakeholder verification.
        """
        data = {
            "passport_id": passport_uuid,
            "lot": lot_number,
            "grade": grade,
            "grade_a_pct": f"{grade_a_pct}%",
            "center": center_code,
            "seal": tamper_hash[:18] + "...",
            "portal": f"https://pyaaz-pro.gov.in/verify/{passport_uuid}"
        }
        return json.dumps(data)

tamper_engine = TamperEvidenceEngine()
