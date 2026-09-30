# PYAAZ-PRO: AI-Powered Onion Quality & Procurement Intelligence

**Problem Statement ID:** 26031  
**Organization:** Ministry of Consumer Affairs, Food & Public Distribution  
**Department:** Department of Consumer Affairs (DoCA)  
**Category:** Software | **Theme:** Smart Automation

---

## 🌾 Executive Summary

**PYAAZ-PRO** standardizes onion quality assessment across agricultural procurement centers (mandis) by unifying:
1. **Computer Vision Defect Segmentation & Metric Size Estimation** (Healthy, Rotten, Damaged, Sprouted, Undersized).
2. **Pre-Inference Image Quality Diagnostics** (Laplacian variance blur, luminance histogram, glare/exposure).
3. **Calibrated Physical Scale Weight Reconciliation** (Count-based vs Weight-based dual assessment).
4. **Configurable Agmarknet / DoCA Procurement Rules Engine** (Grade A % vs URS % calculation with transparent decision trees).
5. **Cryptographic Digital Quality Passports** (Permanent SHA-256 tamper-evident integrity seals & QR verification).
6. **Reinspection & Dispute Adjudication Workflow** (Immutable dual-audit trail preserving original AI findings & secondary re-tests).
7. **Post-Harvest Buffer Storage Deterioration Monitoring** (Warehouse microclimate temperature/RH telemetry with multi-factor biological spoilage risk models).
8. **Operational ML Monitoring & Evaluation Hub** (Actual benchmark mAP@50, mAP@50:95, Precision, Recall, and 5×5 Confusion Matrix).

---

## 🏛️ System Architecture

```
                                  [ CAMERA / MOBILE / SCALE ]
                                               │
                                               ▼
                              [ PRE-INFERENCE IMAGE QUALITY CHECK ]
                              (Laplacian Blur • Glare • Luminance)
                                               │
                                               ▼
                                 [ PYAAZ-CV VISION PIPELINE ]
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
             [ Spatial Bounding Boxes &                     [ Calibrated Metric ]
               Defect Classification ]                        [ Size Estimation ]
             (Healthy, Rot, Damage, Sprout)                   (Pixels-to-mm ratio)
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼
                                  [ DUAL EVIDENCE AGGREGATION ]
                               (Count % vs Physical Weight Kg)
                                               │
                                               ▼
                            [ CONFIGURABLE PROCUREMENT RULES ENGINE ]
                            (DoCA Agmarknet 2026 Procurement Standard)
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
                 [ GRADE A % ]                                     [ URS % ]
           (Healthy >= 45mm, Rot <= 2%)                   (Under-grade / Fair Average)
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼
                              [ TAMPER-EVIDENT QUALITY PASSPORT ]
                                   (SHA-256 Seal • QR Code)
                                               │
                                               ▼
                             [ POST-PROCUREMENT STORAGE MONITORING ]
                             (Temperature • RH • Spoilage Kinetics)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm

### 2. Backend Setup & Startup
```powershell
cd backend
python init_db.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation available at:* `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
```powershell
cd frontend
npm install
npm run dev
```
*Frontend Application available at:* `http://localhost:5173`

---

## 👥 Role-Based Access Personas

| Role | Persona | Permissions |
|---|---|---|
| **Administrator** | Rajesh Verma (`admin` / `admin123`) | Full System Control, Users, Procurement Rules, Mandi Centers, Model Artifacts |
| **Inspector** | Sanjay Sharma (`inspector_sharma` / `inspector123`) | Guided 10-Step Intake, Camera Live Capture, AI Assessment, Defect Overrides, Weighing, Passport Sealing |
| **Supervisor** | Anand Patil (`supervisor_patil` / `supervisor123`) | Mandi Adjudication, Reinspection Dispute Sign-off, Center Benchmarking, Analytics |
| **Warehouse Operator** | Ramesh Deshmukh (`warehouse_ramesh` / `warehouse123`) | Buffer Godown Bay Monitoring, Temperature/RH Sensor Logging, Deterioration Alerts |
| **Viewer / Auditor** | Pooja Kulkarni (`viewer_auditor` / `viewer123`) | Read-Only Audit & Certificate Verification Portal |

---

## 🧪 Testing
Run backend engine tests:
```powershell
cd backend
python -c "from tests.test_core_engines import test_tamper_hash_integrity, test_storage_risk_calculation, test_benchmark_metrics; test_tamper_hash_integrity(); test_storage_risk_calculation(); test_benchmark_metrics(); print('All backend tests passed!')"
```
Build frontend production bundle:
```powershell
cd frontend
npm run build
```
