/**
 * LiveInspectionCamera
 * ──────────────────────────────────────────────────────────────────────────
 * Opens the device webcam and continuously sends frames to the PYAZZ-PRO
 * AI backend (POST /inspections/live-detect).  Detected onions are drawn
 * as labelled bounding boxes on a <canvas> overlay.
 *
 * Session tracking:
 *  - When "Start Camera" is clicked, a new session begins.
 *  - Every confirmed, stable onion detection (seen for MIN_CONFIRM_FRAMES)
 *    is logged to the session log once per unique track.
 *  - When "Stop Camera" is clicked, the session ends and a summary modal
 *    is shown with all onions detected during that session.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ListChecks,
  X,
} from 'lucide-react';
import { api, LiveDetection } from '../../services/api';

// ── constants ────────────────────────────────────────────────────────────────
const POLL_MS = 25;          // ms between frames sent to backend
const CAPTURE_W = 640;
const CAPTURE_H = 480;

/** Frames an onion must be visible before it is "confirmed" and counted in session. */
const MIN_CONFIRM_FRAMES = 4;

/** History window for majority-vote smoothing. */
const HISTORY_WINDOW = 6;

/** Max ms before a track is considered lost. */
const TRACK_EXPIRY_MS = 400;

const CLASS_META: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Healthy:  { label: 'Healthy',  bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Rotten:   { label: 'Rotten',   bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',     icon: <XCircle className="w-3.5 h-3.5" /> },
  Sprouted: { label: 'Sprouted', bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Damaged:  { label: 'Damaged',  bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const CLASS_COLORS: Record<string, string> = {
  Healthy:  '#22c55e',
  Rotten:   '#ef4444',
  Sprouted: '#f59e0b',
  Damaged:  '#f97316',
};

// ── types ─────────────────────────────────────────────────────────────────────
interface TrackedOnion {
  id: number;                       // unique track id within the session
  bbox: number[];
  history: LiveDetection[];
  lastSeen: number;
  confirmed: boolean;               // has it been logged to the session?
}

export interface SessionOnion {
  id: number;
  class_name: LiveDetection['class_name'];
  decision: LiveDetection['decision'];
  confidence: number;
  quality_score: number;
  diameter_mm: number | null;
  size_grade: string;
  color: string;
  timestamp: Date;
}

// ── component ────────────────────────────────────────────────────────────────
interface Props {
  /** Called when the user clicks "Close Live Inspection" */
  onClose?: () => void;
  /** Called when the session is complete and the user clicks continue */
  onSessionComplete?: (onions: SessionOnion[]) => void;
}

let _trackIdCounter = 0;

export const LiveInspectionCamera: React.FC<Props> = ({ onClose, onSessionComplete }) => {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);     // visible overlay canvas
  const captureRef = useRef<HTMLCanvasElement>(null);    // off-screen capture canvas
  const streamRef  = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);

  const [camOn,        setCamOn]        = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [detections,   setDetections]   = useState<LiveDetection[]>([]);
  const [fps,          setFps]          = useState(0);
  const [frameCount,   setFrameCount]   = useState(0);
  const fpsTimerRef    = useRef<number | null>(null);
  const fpsCountRef    = useRef(0);

  // ── session state ─────────────────────────────────────────────────────────
  const [sessionOnions,    setSessionOnions]    = useState<SessionOnion[]>([]);
  const [showSummary,      setShowSummary]      = useState(false);
  const sessionOnionsRef   = useRef<SessionOnion[]>([]);   // keeps sync inside callbacks
  const sessionIdRef       = useRef(0);                    // increments every start

  // ── tracking state ────────────────────────────────────────────────────────
  const trackerRef = useRef<TrackedOnion[]>([]);

  // ── live session counts (derived from sessionOnions) ──────────────────────
  const sessionCounts = sessionOnions.reduce<Record<string, number>>(
    (acc, o) => { acc[o.class_name] = (acc[o.class_name] || 0) + 1; return acc; }, {}
  );

  // ── current-frame counts ──────────────────────────────────────────────────
  const liveCounts = detections.reduce<Record<string, number>>(
    (acc, d) => { acc[d.class_name] = (acc[d.class_name] || 0) + 1; return acc; }, {}
  );
  const liveTotal = detections.length;

  // ── draw bounding boxes on canvas overlay ─────────────────────────────────
  const drawBoxes = useCallback((dets: LiveDetection[], frameW: number, frameH: number) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const containerW = video.clientWidth;
    const containerH = video.clientHeight;
    canvas.width  = containerW;
    canvas.height = containerH;

    // The video uses object-contain, so compute the actual rendered rect
    // (letterboxed, centered inside the container).
    const vidW = video.videoWidth  || frameW || CAPTURE_W;
    const vidH = video.videoHeight || frameH || CAPTURE_H;
    const scale   = Math.min(containerW / vidW, containerH / vidH);
    const rendW   = vidW * scale;
    const rendH   = vidH * scale;
    const offsetX = (containerW - rendW) / 2;
    const offsetY = (containerH - rendH) / 2;

    // Map bbox pixel coords (in the captured 640×480 frame) → display coords
    const scaleX = rendW / (frameW || CAPTURE_W);
    const scaleY = rendH / (frameH || CAPTURE_H);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, containerW, containerH);

    for (const det of dets) {
      const [x1, y1, x2, y2] = det.bbox;
      const rx = offsetX + x1 * scaleX;
      const ry = offsetY + y1 * scaleY;
      const rw = (x2 - x1) * scaleX;
      const rh = (y2 - y1) * scaleY;

      // Box
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Detailed overlay panel
      const sizeStr = det.diameter_mm ? `${det.diameter_mm}mm` : 'Unknown size';
      const lines = [
        `${det.class_name} | ${sizeStr} | ${det.size_grade}`,
        `Quality ${det.quality_score}/100 | Conf ${(det.confidence * 100).toFixed(0)}%`,
        `Decision: ${det.decision}`
      ];

      ctx.font = 'bold 11px DM Mono, monospace';
      const lineHeight = 16;
      let maxLineW = 0;
      for (const line of lines) {
        maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
      }

      const pW = maxLineW + 16;
      const pH = (lines.length * lineHeight) + 12;
      let pX = rx;
      let pY = ry - pH - 6;
      if (pY < 0) pY = ry + rh + 6;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).roundRect(pX, pY, pW, pH, 6);
      ctx.fill();

      ctx.fillStyle = det.color;
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).roundRect(pX, pY, pW, 4, [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < lines.length; i++) {
        if (i === 2) {
           ctx.fillStyle = det.decision === 'CHOOSE' ? '#4ade80' : '#f87171';
        } else {
           ctx.fillStyle = '#f8fafc';
        }
        ctx.fillText(lines[i], pX + 8, pY + 18 + (i * lineHeight));
      }
    }
  }, []);

  // ── IoU helper ────────────────────────────────────────────────────────────
  const getIoU = (b1: number[], b2: number[]) => {
    const left = Math.max(b1[0], b2[0]), top = Math.max(b1[1], b2[1]);
    const right = Math.min(b1[2], b2[2]), bottom = Math.min(b1[3], b2[3]);
    if (left >= right || top >= bottom) return 0;
    const intersection = (right - left) * (bottom - top);
    const a1 = (b1[2] - b1[0]) * (b1[3] - b1[1]);
    const a2 = (b2[2] - b2[0]) * (b2[3] - b2[1]);
    return intersection / (a1 + a2 - intersection);
  };

  // ── one capture + infer cycle ─────────────────────────────────────────────
  const runFrame = useCallback(async () => {
    const video   = videoRef.current;
    const capture = captureRef.current;
    if (!video || !capture || !runningRef.current) return;

    const ctx2d = capture.getContext('2d');
    if (!ctx2d) return;
    capture.width  = CAPTURE_W;
    capture.height = CAPTURE_H;
    ctx2d.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H);
    const b64 = capture.toDataURL('image/jpeg', 1.0);

    try {
      const result = await api.liveDetectFrame(b64);
      if (!runningRef.current) return;

      const now = performance.now();

      // ── Update tracker ──────────────────────────────────────────────────
      for (const det of result.detections) {
        let bestT: TrackedOnion | null = null;
        let bestIoU = 0.05;
        for (const t of trackerRef.current) {
          if (now - t.lastSeen > TRACK_EXPIRY_MS) continue;
          const iou = getIoU(t.bbox, det.bbox);
          if (iou > bestIoU) { bestIoU = iou; bestT = t; }
        }
        if (bestT) {
          bestT.history.push(det);
          if (bestT.history.length > HISTORY_WINDOW) bestT.history.shift();
          bestT.bbox = det.bbox;
          bestT.lastSeen = now;
        } else {
          trackerRef.current.push({
            id: ++_trackIdCounter,
            bbox: det.bbox,
            history: [det],
            lastSeen: now,
            confirmed: false,
          });
        }
      }

      // Expire old tracks
      trackerRef.current = trackerRef.current.filter(t => now - t.lastSeen < TRACK_EXPIRY_MS);

      // ── Smooth outputs via majority vote ────────────────────────────────
      const smoothedDetections: LiveDetection[] = trackerRef.current.map(t => {
        const classes:   Record<string, number> = {};
        const decisions: Record<string, number> = {};
        const grades:    Record<string, number> = {};
        let avgConf = 0, avgScore = 0, avgDia = 0, diaCount = 0;

        for (const h of t.history) {
          classes[h.class_name]  = (classes[h.class_name]  || 0) + 1;
          decisions[h.decision]  = (decisions[h.decision]  || 0) + 1;
          grades[h.size_grade]   = (grades[h.size_grade]   || 0) + 1;
          avgConf  += h.confidence;
          avgScore += h.quality_score;
          if (h.diameter_mm) { avgDia += h.diameter_mm; diaCount++; }
        }

        const len         = t.history.length;
        const modeClass   = Object.keys(classes).reduce((a, b) => classes[a] > classes[b] ? a : b) as LiveDetection['class_name'];
        const modeDecision= Object.keys(decisions).reduce((a, b) => decisions[a] > decisions[b] ? a : b) as LiveDetection['decision'];
        const modeGrade   = Object.keys(grades).reduce((a, b) => grades[a] > grades[b] ? a : b);
        const latest      = t.history[t.history.length - 1];

        return {
          ...latest,
          bbox:          t.bbox as [number, number, number, number],
          class_name:    modeClass,
          decision:      modeDecision,
          size_grade:    modeGrade,
          color:         CLASS_COLORS[modeClass] ?? latest.color,
          confidence:    avgConf / len,
          quality_score: Math.round(avgScore / len),
          diameter_mm:   diaCount > 0 ? Number((avgDia / diaCount).toFixed(1)) : null,
        };
      });

      setDetections(smoothedDetections);
      drawBoxes(smoothedDetections, result.frame_width, result.frame_height);
      fpsCountRef.current += 1;
      setFrameCount(c => c + 1);

      // ── Session logging: confirm tracks seen for MIN_CONFIRM_FRAMES ──────
      for (const t of trackerRef.current) {
        if (!t.confirmed && t.history.length >= MIN_CONFIRM_FRAMES) {
          t.confirmed = true;

          // Build the stable smoothed onion from the current history
          const classes:   Record<string, number> = {};
          const decisions: Record<string, number> = {};
          const grades:    Record<string, number> = {};
          let avgConf = 0, avgScore = 0, avgDia = 0, diaCount = 0;
          for (const h of t.history) {
            classes[h.class_name]  = (classes[h.class_name]  || 0) + 1;
            decisions[h.decision]  = (decisions[h.decision]  || 0) + 1;
            grades[h.size_grade]   = (grades[h.size_grade]   || 0) + 1;
            avgConf  += h.confidence;
            avgScore += h.quality_score;
            if (h.diameter_mm) { avgDia += h.diameter_mm; diaCount++; }
          }
          const len         = t.history.length;
          const modeClass   = Object.keys(classes).reduce((a, b) => classes[a] > classes[b] ? a : b) as LiveDetection['class_name'];
          const modeDecision= Object.keys(decisions).reduce((a, b) => decisions[a] > decisions[b] ? a : b) as LiveDetection['decision'];
          const modeGrade   = Object.keys(grades).reduce((a, b) => grades[a] > grades[b] ? a : b);

          const newOnion: SessionOnion = {
            id:            t.id,
            class_name:    modeClass,
            decision:      modeDecision,
            confidence:    avgConf / len,
            quality_score: Math.round(avgScore / len),
            diameter_mm:   diaCount > 0 ? Number((avgDia / diaCount).toFixed(1)) : null,
            size_grade:    modeGrade,
            color:         CLASS_COLORS[modeClass] ?? '#94a3b8',
            timestamp:     new Date(),
          };

          sessionOnionsRef.current = [...sessionOnionsRef.current, newOnion];
          setSessionOnions([...sessionOnionsRef.current]);
        }
      }

      if (result.error) console.warn('[LiveDetect]', result.error);
    } catch (e: any) {
      console.warn('[LiveDetect] frame error:', e.message);
    }
  }, [drawBoxes]);

  // ── sequential polling loop ───────────────────────────────────────────────
  const startLoop = useCallback(async () => {
    while (runningRef.current) {
      await runFrame();
      await new Promise(res => setTimeout(res, POLL_MS));
    }
  }, [runFrame]);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    if (fpsTimerRef.current) { clearInterval(fpsTimerRef.current); fpsTimerRef.current = null; }
  }, []);

  // ── start / stop camera ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    setLoading(true);
    setShowSummary(false);

    // Reset session
    sessionOnionsRef.current = [];
    setSessionOnions([]);
    trackerRef.current = [];
    sessionIdRef.current += 1;
    setFrameCount(0);
    setFps(0);
    setDetections([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: CAPTURE_W }, height: { ideal: CAPTURE_H }, facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      runningRef.current = true;
      setCamOn(true);
      startLoop();

      fpsTimerRef.current = window.setInterval(() => {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
      }, 1000);
    } catch (e: any) {
      setError(`Camera access denied or not available: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [startLoop]);

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    stopLoop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
    setDetections([]);
    trackerRef.current = [];

    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

    // Show summary only if at least one onion was found
    if (sessionOnionsRef.current.length > 0) {
      setShowSummary(true);
    }
  }, [stopLoop]);

  // cleanup on unmount
  useEffect(() => () => {
    runningRef.current = false;
    stopLoop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, [stopLoop]);

  // ── Session Summary Modal ─────────────────────────────────────────────────
  const SummaryModal = () => {
    if (!showSummary) return null;

    const total = sessionOnions.length;
    const counts = sessionOnions.reduce<Record<string, number>>(
      (acc, o) => { acc[o.class_name] = (acc[o.class_name] || 0) + 1; return acc; }, {}
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-700 flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white tracking-wide font-mono uppercase">
                  Session Summary
                </p>
                <p className="text-[10px] text-slate-400 font-mono">{total} onion{total !== 1 ? 's' : ''} detected this session</p>
              </div>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Count tiles */}
          <div className="px-4 pt-4 pb-2 grid grid-cols-4 gap-2">
            {(['Healthy', 'Rotten', 'Sprouted', 'Damaged'] as const).map(cls => {
              const meta = CLASS_META[cls];
              const cnt  = counts[cls] || 0;
              return (
                <div key={cls} className={`flex flex-col items-center justify-center p-2 rounded-xl ${meta.bg} border ${meta.border}`}>
                  <span className={`text-[22px] font-black font-mono ${meta.text}`}>{cnt}</span>
                  <span className={`text-[9px] font-bold uppercase ${meta.text} opacity-80`}>{meta.label}</span>
                </div>
              );
            })}
          </div>

          {/* Onion list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 mt-1">
            {sessionOnions.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No onions were detected during this session.</p>
            ) : (
              sessionOnions.map((o, idx) => {
                const meta = CLASS_META[o.class_name] || CLASS_META['Damaged'];
                return (
                  <div key={o.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] font-mono text-slate-400 w-5 text-right flex-shrink-0">#{idx + 1}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold ${meta.text}`}>{o.class_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(o.confidence * 100).toFixed(0)}% conf
                        {o.diameter_mm ? ` · ⌀${o.diameter_mm}mm` : ''}
                        {' · '}Quality {o.quality_score}/100
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                          o.decision === 'CHOOSE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {o.decision === 'CHOOSE' ? '✓' : '✗'} {o.size_grade}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {o.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                setShowSummary(false);
                if (onSessionComplete) onSessionComplete(sessionOnions);
                else if (onClose) onClose();
              }}
              className="flex-1 px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              Continue to Next Step <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              Retake / New Session
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <SummaryModal />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white tracking-wide font-mono uppercase">
                Live AI Inspection
              </p>
              <p className="text-[10px] text-slate-400 font-mono">PYAZZ-PRO · AI Vision Model</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {camOn && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                LIVE · {fps} fps · {frameCount} frames
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Camera / Canvas area */}
          <div className="relative flex-1 bg-slate-950 min-h-[320px] flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-contain bg-slate-950"
              style={{ display: camOn ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: camOn ? 'block' : 'none' }}
            />
            <canvas ref={captureRef} className="hidden" />

            {/* Idle / error state */}
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  {error ? <CameraOff className="w-8 h-8 text-red-400" /> : <Camera className="w-8 h-8 text-slate-400" />}
                </div>
                {error ? (
                  <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>
                ) : (
                  <p className="text-slate-400 text-xs text-center max-w-xs">
                    Click <strong className="text-white">Start Camera</strong> to begin a new session.<br />
                    The AI model will detect and count onions automatically.
                  </p>
                )}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                <RefreshCw className="w-8 h-8 text-forest-400 animate-spin" />
              </div>
            )}

            {/* Corner scan-lines decoration */}
            {camOn && (
              <>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-forest-400 rounded-tl pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-forest-400 rounded-tr pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-forest-400 rounded-bl pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-forest-400 rounded-br pointer-events-none" />
              </>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-64 bg-slate-50 border-l border-slate-200 flex flex-col">

            {/* ── SESSION counts ── */}
            <div className="p-4 border-b border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3" />
                Session Totals
              </p>
              <div className="space-y-1.5">
                {(['Healthy', 'Rotten', 'Sprouted', 'Damaged'] as const).map(cls => {
                  const meta = CLASS_META[cls];
                  const cnt  = sessionCounts[cls] || 0;
                  const pct  = sessionOnions.length > 0 ? Math.round((cnt / sessionOnions.length) * 100) : 0;
                  return (
                    <div key={cls} className={`flex items-center justify-between p-1.5 rounded-lg ${meta.bg} border ${meta.border}`}>
                      <div className={`flex items-center gap-1 text-[11px] font-semibold ${meta.text}`}>
                        {meta.icon}
                        {meta.label}
                      </div>
                      <div className={`text-[11px] font-black font-mono ${meta.text}`}>
                        {cnt} <span className="font-normal opacity-60">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono text-slate-500">
                <span>Total this session:</span>
                <span className="font-bold text-slate-800">{sessionOnions.length}</span>
              </div>
            </div>

            {/* ── LIVE frame summary ── */}
            <div className="p-4 border-b border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Live Frame</p>
              <div className="space-y-1">
                {(['Healthy', 'Rotten', 'Sprouted', 'Damaged'] as const).map(cls => {
                  const meta = CLASS_META[cls];
                  const cnt  = liveCounts[cls] || 0;
                  return (
                    <div key={cls} className="flex items-center justify-between text-[11px]">
                      <span className={`flex items-center gap-1 font-medium ${meta.text}`}>
                        {meta.icon}{meta.label}
                      </span>
                      <span className={`font-black font-mono ${meta.text}`}>{cnt}</span>
                    </div>
                  );
                })}
                <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px] font-mono text-slate-500">
                  <span>In frame now:</span>
                  <span className="font-bold text-slate-800">{liveTotal}</span>
                </div>
              </div>
            </div>

            {/* ── Recent session detections ── */}
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Recent Detections</p>
              {sessionOnions.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  {camOn ? 'Watching for onions…' : 'No session started yet.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {[...sessionOnions].reverse().slice(0, 8).map((o, i) => {
                    const meta = CLASS_META[o.class_name] || CLASS_META['Damaged'];
                    return (
                      <div key={o.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${meta.text} truncate`}>{o.class_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {(o.confidence * 100).toFixed(0)}% conf
                            {o.diameter_mm ? ` · ⌀${o.diameter_mm}mm` : ''}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                            o.decision === 'CHOOSE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {o.decision === 'CHOOSE' ? '✓' : '✗'} {o.size_grade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-slate-200 space-y-2">
              {!camOn ? (
                <button
                  onClick={startCamera}
                  disabled={loading}
                  id="live-inspection-start-btn"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  id="live-inspection-stop-btn"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </button>
              )}
              {!camOn && sessionOnions.length > 0 && (
                <button
                  onClick={() => setShowSummary(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  View Session Report ({sessionOnions.length})
                </button>
              )}
              {onClose && (
                <button
                  onClick={() => { stopCamera(); onClose(); }}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                >
                  Close Live Inspection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
