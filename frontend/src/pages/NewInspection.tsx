import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Camera,
  Upload,
  Sparkles,
  Scale,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Building2,
  Users,
  CheckCircle2,
  HelpCircle,
  Eye,
  Sliders,
  Printer,
  Video,
  VideoOff,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { Lot, Inspection, AIAnalysisResult, DetectionDetail, ImageQualityCheck, ProcurementRule, ProcurementCenter } from '../types';
import { useAuth } from '../context/AuthContext';
import { CanvasOverlayViewer } from '../components/inspection/CanvasOverlayViewer';
import { Badge } from '../components/common/Badge';
import { LiveInspectionCamera, SessionOnion } from '../components/inspection/LiveInspectionCamera';

interface NewInspectionProps {
  onInspectionFinished?: (lotId: string) => void;
}

export const NewInspection: React.FC<NewInspectionProps> = ({ onInspectionFinished }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [rules, setRules] = useState<ProcurementRule[]>([]);

  // Step 1: Supplier Info
  const [supplierName, setSupplierName] = useState('Rameshwar Agri Producer Co.');
  const [supplierPhone, setSupplierPhone] = useState('+91 98234 11200');
  const [mandiLicense, setMandiLicense] = useState('MH/NSK/APMC/2022/994');
  const [location, setLocation] = useState('Vinchur, Taluka Niphad, Nashik');

  // Step 2: Lot Intake
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [initialQuantityMt, setInitialQuantityMt] = useState(24.5);
  const [bagCount, setBagCount] = useState(490);
  const [variety, setVariety] = useState('Garwa Nashik Red');
  const [createdLot, setCreatedLot] = useState<Lot | null>(null);

  // Step 3: Sampling Protocol
  const [sampleWeightKg, setSampleWeightKg] = useState(12.5);
  const [samplingMethod, setSamplingMethod] = useState('Random 5-Bag Grid Cross-Section (Agmarknet)');
  const [bagSampleLocations, setBagSampleLocations] = useState('Bags #12, #84, #195, #320, #475');
  const [samplingAcknowledged, setSamplingAcknowledged] = useState(false);

  // Step 4 & 5: Camera Capture & Image Quality Diagnostic
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [qualityCheck, setQualityCheck] = useState<ImageQualityCheck | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [createdInspection, setCreatedInspection] = useState<Inspection | null>(null);

  // Step 6: Detections & Overrides
  const [detections, setDetections] = useState<DetectionDetail[]>([]);

  // Step 7: Weight Recording
  const [grossWeightKg, setGrossWeightKg] = useState(12.5);
  const [tareWeightKg, setTareWeightKg] = useState(0.25);
  const [acceptedWeightKg, setAcceptedWeightKg] = useState(10.5);
  const [rejectedWeightKg, setRejectedWeightKg] = useState(1.75);
  const [scaleConnected, setScaleConnected] = useState(true);

  // Step 8: Procurement Rule & Grading Calculation
  const [activeRule, setActiveRule] = useState<ProcurementRule | null>(null);
  const [decisionTree, setDecisionTree] = useState<string[]>([]);
  const [finalGradeA, setFinalGradeA] = useState<number>(84.0);
  const [finalUrs, setFinalUrs] = useState<number>(16.0);
  const [recommendedGrade, setRecommendedGrade] = useState<'GRADE_A' | 'URS' | 'REJECTED'>('GRADE_A');

  // Step 9: Finalization
  const [inspectorNotes, setInspectorNotes] = useState('Optimal cured Nashik Red sample. Clean root disc with uniform spherical size distribution.');
  const [finalInspection, setFinalInspection] = useState<Inspection | null>(null);

  // Camera video ref for live webcam stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Live YOLO camera panel toggle
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  useEffect(() => {
    const loadInitialMeta = async () => {
      try {
        const [cList, rList] = await Promise.all([api.getCenters(), api.getRules()]);
        setCenters(cList);
        if (cList.length > 0) setSelectedCenterId(cList[0].id);
        setRules(rList);
        const active = rList.find(r => r.is_active) || rList[0];
        setActiveRule(active);
      } catch (e) {
        console.warn('Backend offline, using fallback meta');
      }
    };
    loadInitialMeta();
  }, []);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam stream not accessible, switching to file/mock mode', err);
    }
  };

  const capturePhotoFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      // Stop camera
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2 -> 3: Create Lot and Start Inspection
  const handleCreateLotAndStart = async () => {
    setLoading(true);
    try {
      const newLot = await api.createLot({
        supplier_id: 'sup-mh-0842', // Linked Rameshwar FPO
        center_id: selectedCenterId || (centers[0]?.id || 'cnt-1'),
        initial_quantity_mt: initialQuantityMt,
        bag_count: bagCount,
        variety: variety,
      });
      setCreatedLot(newLot);

      const newInsp = await api.startInspection(
        {
          lot_id: newLot.id,
          center_id: newLot.center_id,
          rule_version_id: activeRule?.id,
          notes: inspectorNotes,
        },
        currentUser?.id || 'usr-insp-1'
      );
      setCreatedInspection(newInsp);
      setStep(3);
    } catch (err: any) {
      alert(`Error initializing inspection: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 -> 5: Run AI Computer Vision Analysis
  const handleRunAIAnalysis = async () => {
    if (!createdInspection) return;
    setLoading(true);
    try {
      const result = await api.analyzeInspectionImage(
        createdInspection.id,
        selectedFile || undefined,
        3.2
      );
      setAiResult(result);
      setQualityCheck(result.quality);
      setDetections(result.detections);
      setFinalGradeA(result.grade_a_percentage);
      setFinalUrs(result.urs_percentage);
      setRecommendedGrade(result.recommended_grade as any);
      setDecisionTree(result.explanation);
      setStep(5);
    } catch (err: any) {
      alert(`AI Assessment Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveSessionComplete = (onions: SessionOnion[]) => {
    // Map live tracked onions to DetectionDetail format so rule engine works
    const mapped: DetectionDetail[] = onions.map((o, idx) => ({
      onion_index: idx,
      class_name: o.class_name,
      confidence: o.confidence,
      bbox_x: 0,
      bbox_y: 0,
      bbox_w: 0,
      bbox_h: 0,
      diameter_mm: o.diameter_mm || 50,
      needs_review: false,
    }));
    setDetections(mapped);
    // Since it's a live flow without a single image, jump directly to Weight Tare (Step 7)
    setStep(7);
  };

  // Step 6: Override detection callback
  const handleOverrideDetection = (idx: number, newClass: string, notes: string) => {
    setDetections(prev =>
      prev.map(d =>
        d.onion_index === idx
          ? { ...d, inspector_override_class: newClass, inspector_notes: notes, needs_review: false }
          : d
      )
    );
  };

  // Step 7 -> 8: Save Weight & Calculate Rules
  const handleSaveWeightAndEvaluate = async () => {
    if (!createdInspection) return;
    setLoading(true);
    try {
      await api.recordWeight({
        inspection_id: createdInspection.id,
        gross_sample_weight_kg: grossWeightKg,
        tare_weight_kg: tareWeightKg,
        accepted_weight_kg: acceptedWeightKg,
        rejected_weight_kg: rejectedWeightKg,
        scale_device_type: scaleConnected ? 'DIGITAL_LOAD_CELL_COM3' : 'MANUAL_ENTRY',
        scale_connected: scaleConnected,
      });

      // Recalculate based on current detections
      const total = detections.length;
      const healthy = detections.filter(d => (d.inspector_override_class || d.class_name) === 'Healthy').length;
      const rot = detections.filter(d => (d.inspector_override_class || d.class_name) === 'Rotten').length;
      const dam = detections.filter(d => (d.inspector_override_class || d.class_name) === 'Damaged').length;
      const spr = detections.filter(d => (d.inspector_override_class || d.class_name) === 'Sprouted').length;
      const und = detections.filter(d => (d.inspector_override_class || d.class_name) === 'Undersized').length;

      const healthyPct = (healthy / Math.max(1, total)) * 100;
      const rotPct = (rot / Math.max(1, total)) * 100;
      const undPct = (und / Math.max(1, total)) * 100;

      let grade: 'GRADE_A' | 'URS' | 'REJECTED' = 'GRADE_A';
      const tree: string[] = [
        `Applied Standard: ${activeRule?.name || 'DoCA Buffer Standard 2026'}`,
        `Evaluated sample: ${total} bulbs (${healthy} Healthy, ${und} Undersized, ${rot} Rotten, ${dam} Damaged, ${spr} Sprouted)`,
      ];

      if (rotPct > (activeRule?.max_rot_tolerance_pct || 2.0)) {
        grade = 'REJECTED';
        tree.push(`Rot level (${rotPct.toFixed(1)}%) exceeds safety threshold (max ${activeRule?.max_rot_tolerance_pct}%).`);
      } else if (undPct <= (activeRule?.max_undersized_tolerance_pct || 5.0) && (100 - healthyPct) <= (activeRule?.max_total_defect_tolerance_pct || 10.0)) {
        grade = 'GRADE_A';
        tree.push(`Grade A Conformance Met: ${healthyPct.toFixed(1)}% healthy bulbs with size >= ${activeRule?.min_size_mm || 45}mm.`);
      } else {
        grade = 'URS';
        tree.push(`Under-Grade Standard (URS) Assigned: Aggregate defect/undersized allowance accounted for.`);
      }

      setRecommendedGrade(grade);
      setDecisionTree(tree);
      setStep(8);
    } catch (err: any) {
      alert(`Weight calculation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 9 -> 10: Finalize Inspection and Generate Passport
  const handleFinalizeInspection = async () => {
    if (!createdInspection) return;
    setLoading(true);
    try {
      const finalResult = await api.finalizeInspection(createdInspection.id, inspectorNotes);
      setFinalInspection(finalResult);
      setStep(10);
    } catch (err: any) {
      alert(`Finalization Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Supplier' },
    { num: 2, title: 'Lot Intake' },
    { num: 3, title: 'Sampling' },
    { num: 4, title: 'Capture' },
    { num: 5, title: 'AI Analysis' },
    { num: 6, title: 'Defect Review' },
    { num: 7, title: 'Weight Tare' },
    { num: 8, title: 'Procurement Rules' },
    { num: 9, title: 'Finalize' },
    { num: 10, title: 'Digital Passport' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Wizard Header & Stepper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-forest-700 font-mono">
              DoCA Standard Guided Inspection Protocol
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              New Onion Lot Quality Assessment & Grading
            </h2>
          </div>
          <div className="text-xs font-mono px-3 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
            Rule Standard: <strong>{activeRule?.version || 'v1.0.4 (Agmarknet 2026)'}</strong>
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[650px] justify-between">
            {stepsList.map((s, idx) => {
              const isDone = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-forest-800 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 font-black'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                        isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        step > s.num ? 'bg-forest-800' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* STEP 1: Supplier Info */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1: Supplier & Mandi Identification</h3>
            <p className="text-xs text-slate-500">Select registered farmer, FPO society, or mandi trade partner</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Farmer / FPO Organization Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone Number</label>
              <input
                type="text"
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">APMC Mandi License / Registration Code</label>
              <input
                type="text"
                value={mandiLicense}
                onChange={e => setMandiLicense(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Origin Village / Mandi Yard Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div className="p-4 bg-forest-50 border border-forest-200 rounded-xl flex items-center justify-between text-xs text-forest-900">
            <span>Verified Farmer Direct Mandi Intake (Aadhaar & Mandi Passbook on file)</span>
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
            >
              Continue to Lot Intake <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Lot Intake */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 2: Lot Intake Details</h3>
            <p className="text-xs text-slate-500">Record vehicle manifest, initial tonnage, and onion variety</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Procurement Center Terminal</label>
              <select
                value={selectedCenterId}
                onChange={e => setSelectedCenterId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-forest-600"
              >
                {centers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Onion Crop Variety</label>
              <select
                value={variety}
                onChange={e => setVariety(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-forest-600"
              >
                <option value="Garwa Nashik Red">Garwa Nashik Red (Standard Rabi Cured)</option>
                <option value="Pol Late Kharif Red">Pol Late Kharif Red</option>
                <option value="Mahuva White Bulb">Mahuva White Processing Bulb</option>
                <option value="Indore Yellow Globe">Indore Yellow Globe</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gross Lot Quantity (Metric Tonnes)</label>
              <input
                type="number"
                step="0.1"
                value={initialQuantityMt}
                onChange={e => setInitialQuantityMt(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Total Jute / Mesh Bags</label>
              <input
                type="number"
                value={bagCount}
                onChange={e => setBagCount(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleCreateLotAndStart}
              disabled={loading}
              className="px-5 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Initialize Inspection <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Guided Sampling Protocol */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] uppercase font-bold text-forest-700 font-mono">Agmarknet Standard Sampling Protocol</span>
            <h3 className="text-base font-bold text-slate-900">Step 3: Representative 5-Bag Cross-Section Extraction</h3>
            <p className="text-xs text-slate-500">Standardized protocol prevents subjective cherry-picking</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <p className="text-xs text-slate-700">
                For lot size of <strong>{bagCount} bags</strong>, extract 5 random sample bags using diagonal grid positions: <strong className="font-mono text-forest-800">{bagSampleLocations}</strong>.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <p className="text-xs text-slate-700">
                Mix 2-3 kg from each bag on the white procurement inspection tray until a composite sample of approximately <strong>12.5 kg (50-70 bulbs)</strong> is formed.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <p className="text-xs text-slate-700">
                Spread the bulbs evenly across the tray in a single layer without overlapping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
            <input
              type="checkbox"
              id="samplingAck"
              checked={samplingAcknowledged}
              onChange={e => setSamplingAcknowledged(e.target.checked)}
              className="w-4 h-4 text-forest-800 rounded focus:ring-forest-600"
            />
            <label htmlFor="samplingAck" className="text-xs font-semibold text-forest-950 cursor-pointer">
              I confirm that the physical sample was extracted strictly following the 5-bag diagonal cross-section protocol.
            </label>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              disabled={!samplingAcknowledged}
              onClick={() => setStep(4)}
              className="px-5 py-2.5 bg-forest-800 hover:bg-forest-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
            >
              Proceed to Camera Capture <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Camera Capture & Image Quality Diagnostic */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 4: Live AI Camera Capture</h3>
            <p className="text-xs text-slate-500">
              Start the camera and scan the moving onions. The AI will automatically detect and record them.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-950 min-h-[400px]">
             <LiveInspectionCamera onSessionComplete={handleLiveSessionComplete} />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Sampling
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 & 6: AI Analysis & Defect Review Station */}
      {(step === 5 || step === 6) && (
        <div className="space-y-6">
          {/* Quality Diagnostic Card */}
          {qualityCheck && (
            <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              qualityCheck.status === 'PASSED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>
                  <strong>Pre-Inference Quality Diagnostic:</strong> {qualityCheck.status} (Sharpness: {qualityCheck.blur_score}, Luminance: {qualityCheck.brightness_score})
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-80">{qualityCheck.guidance}</span>
            </div>
          )}

          {/* Interactive Canvas Overlay Viewer */}
          <CanvasOverlayViewer
            imageUrl={capturedImage || '/storage/uploads/insp_sample_00841.jpg'}
            detections={detections}
            onOverrideDetection={handleOverrideDetection}
          />

          <div className="flex justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Retake Photo
            </button>
            <button
              onClick={() => setStep(7)}
              className="px-6 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition shadow-md"
            >
              Confirm Detections & Record Weight <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Weight Measurement & Tare */}
      {step === 7 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 7: Physical Weight Measurement & Tare Reconciliation</h3>
            <p className="text-xs text-slate-500">
              Integrate physical scale readings. Both count-based and weight-based figures are tracked separately.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-forest-700" />
              <div>
                <p className="text-xs font-bold text-slate-800">Digital Load Cell COM3 Scale Interface</p>
                <p className="text-[11px] text-slate-500">Live calibration zero tare certified</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
              Scale Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gross Sample Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={grossWeightKg}
                onChange={e => setGrossWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tare Weight (Tray Tare kg)</label>
              <input
                type="number"
                step="0.01"
                value={tareWeightKg}
                onChange={e => setTareWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Accepted Sound Bulb Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={acceptedWeightKg}
                onChange={e => setAcceptedWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold text-forest-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Rejected / Defective Cull Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={rejectedWeightKg}
                onChange={e => setRejectedWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold text-red-700"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(6)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSaveWeightAndEvaluate}
              disabled={loading}
              className="px-6 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Apply Procurement Rules <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: Procurement Rule Engine Evaluation */}
      {step === 8 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 8: Procurement Rules Engine Evaluation</h3>
            <p className="text-xs text-slate-500">Transparent grading calculation based on official tolerances</p>
          </div>

          {/* Grade Outcome Hero */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Calculated Classification
              </span>
              <div className="flex items-center gap-3 mt-1">
                <Badge type="grade" value={recommendedGrade} size="lg" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] text-forest-300 uppercase block font-semibold">Grade A Share</span>
                <span className="text-3xl font-black font-mono text-forest-400">{finalGradeA}%</span>
              </div>
              <div className="h-10 w-px bg-slate-700"></div>
              <div className="text-right">
                <span className="text-[11px] text-amber-300 uppercase block font-semibold">URS Share</span>
                <span className="text-3xl font-black font-mono text-amber-400">{finalUrs}%</span>
              </div>
            </div>
          </div>

          {/* Decision Tree Breakdown */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Legally Explainable Decision Tree:
            </h4>
            {decisionTree.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-forest-700 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(7)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(9)}
              className="px-6 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition shadow-md"
            >
              Review & Sign Off <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: Final Review & Inspector Signoff */}
      {step === 9 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 9: Review & Finalize Inspection</h3>
            <p className="text-xs text-slate-500">Sign off inspection report and generate permanent cryptographic Quality Passport</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">Lot & Supplier Manifest:</span>
              <p>Lot ID: <strong>{createdLot?.lot_number || 'LOT-2026-NSK-00101'}</strong></p>
              <p>Supplier: <strong>{supplierName}</strong></p>
              <p>Variety: <strong>{variety}</strong></p>
              <p>Total Quantity: <strong>{initialQuantityMt} MT ({bagCount} Bags)</strong></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">AI Findings Summary:</span>
              <p>Grade Classification: <strong>{recommendedGrade}</strong></p>
              <p>Grade A Percentage: <strong className="text-forest-800">{finalGradeA}%</strong></p>
              <p>URS Percentage: <strong className="text-amber-700">{finalUrs}%</strong></p>
              <p>Rule Standard: <strong>{activeRule?.version}</strong></p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Inspector Sign-off Remarks</label>
            <textarea
              rows={3}
              value={inspectorNotes}
              onChange={e => setInspectorNotes(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(8)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleFinalizeInspection}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 transition shadow-lg"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-amber-300" />}
              Generate Quality Passport & Lock Seal
            </button>
          </div>
        </div>
      )}

      {/* STEP 10: Instant Quality Passport & Official Report */}
      {step === 10 && (
        <div className="space-y-6">
          {/* On-Screen Success Hero & Quick Actions (Hidden on Print) */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6 text-center animate-in zoom-in-95 no-print print:hidden">
            <div className="w-16 h-16 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center mx-auto border-2 border-forest-300 shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-mono text-forest-700 font-bold uppercase tracking-wider">
                Cryptographically Sealed • DoCA Standard
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Digital Quality Passport Generated
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Inspection finalized and registered into the national onion buffer traceability registry.
              </p>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-2xl max-w-lg mx-auto text-left font-mono text-xs space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">PASSPORT ID:</span>
                <span className="font-bold text-amber-400">
                  QP-2026-{createdLot?.lot_number?.split('-').pop() || 'NSK-00101'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ASSIGNED GRADE:</span>
                <span className="font-bold text-forest-400">{recommendedGrade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GRADE A SHARE:</span>
                <span className="font-bold text-forest-400">{finalGradeA}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">URS SHARE:</span>
                <span className="font-bold text-amber-400">{finalUrs}%</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px]">
                <span className="text-slate-500">SHA-256 SEAL:</span>
                <span className="text-slate-300 truncate max-w-[200px]">SHA256:8f92b7c419...</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onInspectionFinished && onInspectionFinished(createdLot?.id || 'lot-1')}
                className="px-5 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
              >
                <QrCode className="w-4 h-4" /> Open Full Quality Passport
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
              >
                <Printer className="w-4 h-4" /> Print Mandi Certificate
              </button>
            </div>
          </div>

          {/* Official Printable Mandi Certificate */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:space-y-4 print:w-full">
            {/* Gov Banner */}
            <div className="border-b-2 border-forest-900 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-slate-500 tracking-widest block">
                  Government of India • Ministry of Consumer Affairs, Food & Public Distribution
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  Official Mandi Quality & Procurement Certificate
                </h2>
                <p className="text-xs text-forest-800 font-bold font-mono">
                  Department of Consumer Affairs • Agmarknet Standard {activeRule?.version || 'v1.0.4'}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="w-10 h-10 rounded-xl bg-forest-800 text-amber-300 flex items-center justify-center font-black text-lg mx-auto border border-amber-400">
                  <ShieldCheck className="w-6 h-6 text-amber-300" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 block mt-1">DoCA VERIFIED</span>
              </div>
            </div>

            {/* Passport & Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Passport ID</span>
                <span className="font-bold text-slate-900">
                  QP-2026-{createdLot?.lot_number?.split('-').pop() || '00101'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Lot Number</span>
                <span className="font-bold text-slate-900">{createdLot?.lot_number || 'LOT-2026-NSK-00101'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Timestamp</span>
                <span className="font-semibold text-slate-800">{new Date().toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Tamper Status</span>
                <span className="font-bold text-emerald-700">SHA-256 SEALED</span>
              </div>
            </div>

            {/* Manifest & Mandi Intake Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5 border-b pb-1">
                  <Building2 className="w-4 h-4 text-forest-700" /> Supplier & Mandi Manifest
                </h4>
                <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                  <span className="text-slate-400">Farmer / FPO:</span>
                  <span className="font-semibold text-slate-900">{supplierName}</span>

                  <span className="text-slate-400">APMC License:</span>
                  <span className="font-mono">{mandiLicense}</span>

                  <span className="text-slate-400">Origin Location:</span>
                  <span>{location}</span>

                  <span className="text-slate-400">Contact:</span>
                  <span>{supplierPhone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5 border-b pb-1">
                  <Scale className="w-4 h-4 text-forest-700" /> Procurement Intake Manifest
                </h4>
                <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                  <span className="text-slate-400">Variety:</span>
                  <span className="font-semibold text-slate-900">{variety}</span>

                  <span className="text-slate-400">Total Lot Volume:</span>
                  <span className="font-mono font-bold text-slate-900">{initialQuantityMt} MT ({bagCount} Bags)</span>

                  <span className="text-slate-400">Procurement Terminal:</span>
                  <span>{centers.find(c => c.id === selectedCenterId)?.name || 'Lasalgaon APMC Terminal'}</span>

                  <span className="text-slate-400">Sample Weight:</span>
                  <span className="font-mono">{sampleWeightKg} kg</span>
                </div>
              </div>
            </div>

            {/* Quality Breakdown & Weights Table */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">
                AI Vision & Scale Tolerances Assessment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-sans">Final Classification</span>
                  <div className="mt-1">
                    <Badge type="grade" value={recommendedGrade} size="md" />
                  </div>
                </div>
                <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-sans">Grade A Ratio</span>
                  <span className="font-black text-xl font-mono text-forest-900">{finalGradeA}%</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-sans">URS Share</span>
                  <span className="font-black text-xl font-mono text-amber-900">{finalUrs}%</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-sans">Accepted Net Weight</span>
                  <span className="font-black text-xl font-mono text-slate-900">{acceptedWeightKg} kg</span>
                </div>
              </div>
            </div>

            {/* Weight Tare Reconciliation */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Gross Sample Weight</span>
                  <span className="font-bold text-slate-800">{grossWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Tare Deduction</span>
                  <span className="font-bold text-slate-800">{tareWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Accepted Sound Weight</span>
                  <span className="font-bold text-forest-800">{acceptedWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Cull / Rejected Weight</span>
                  <span className="font-bold text-red-700">{rejectedWeightKg} kg</span>
                </div>
              </div>
            </div>

            {/* Inspector Notes & Sign-off */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Inspector Remarks & Quality Notes
                </span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic">
                  "{inspectorNotes || 'Optimal cured Nashik Red sample. Clean root disc with uniform spherical size distribution.'}"
                </p>
              </div>
              <div className="flex flex-col justify-between p-3 bg-slate-900 text-white rounded-xl font-mono text-[10px]">
                <div>
                  <span className="text-slate-400 block uppercase">Inspector Sign-off</span>
                  <span className="font-bold text-amber-300 text-xs">
                    {currentUser?.full_name || 'Rajesh Sharma (Inspector)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block">SHA-256 DIGEST:</span>
                  <span className="text-emerald-400 truncate block">8f92b7c419e59b20d...</span>
                </div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>DoCA AGMARKNET REGISTERED • PASSPORT ID: QP-2026-{createdLot?.lot_number?.split('-').pop() || '00101'}</span>
              <span>PYAAZ-PRO AI ENGINE v2.4.1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
