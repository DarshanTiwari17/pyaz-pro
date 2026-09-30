import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { DetectionDetail } from '../../types';

interface CanvasOverlayViewerProps {
  imageUrl: string;
  detections: DetectionDetail[];
  onOverrideDetection?: (detectionIndex: number, newClass: string, notes: string) => void;
  readOnly?: boolean;
}

export const CanvasOverlayViewer: React.FC<CanvasOverlayViewerProps> = ({
  imageUrl,
  detections,
  onOverrideDetection,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('ALL');

  const [selectedDetection, setSelectedDetection] = useState<DetectionDetail | null>(null);
  const [overrideClass, setOverrideClass] = useState<string>('Healthy');
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const classColors: Record<string, { stroke: string; fill: string; text: string }> = {
    Healthy: { stroke: '#1E4D2B', fill: 'rgba(30, 77, 43, 0.15)', text: '#1E4D2B' },
    Rotten: { stroke: '#DC2626', fill: 'rgba(220, 38, 38, 0.25)', text: '#991B1B' },
    Damaged: { stroke: '#D97706', fill: 'rgba(217, 119, 6, 0.20)', text: '#B45309' },
    Sprouted: { stroke: '#65A30D', fill: 'rgba(101, 163, 13, 0.25)', text: '#4D7C0F' },
    Undersized: { stroke: '#2563EB', fill: 'rgba(37, 99, 235, 0.20)', text: '#1D4ED8' },
  };

  // Draw on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl.startsWith('http') || imageUrl.startsWith('data:')
      ? imageUrl
      : `http://localhost:8000${imageUrl}`;

    img.onload = () => {
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!showBoxes) return;

      // Draw bounding boxes and tags
      detections.forEach(det => {
        const activeClass = det.inspector_override_class || det.class_name;
        if (filterClass !== 'ALL' && activeClass !== filterClass) return;

        const bx = det.bbox_x * canvas.width;
        const by = det.bbox_y * canvas.height;
        const bw = det.bbox_w * canvas.width;
        const bh = det.bbox_h * canvas.height;

        const colors = classColors[activeClass] || classColors.Healthy;
        const isSelected = selectedDetection?.onion_index === det.onion_index;

        // Bounding box rectangle
        ctx.fillStyle = colors.fill;
        ctx.fillRect(bx, by, bw, bh);

        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.strokeStyle = isSelected ? '#3B82F6' : colors.stroke;
        ctx.strokeRect(bx, by, bw, bh);

        // Circular center point
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, 4, 0, 2 * Math.PI);
        ctx.fillStyle = colors.stroke;
        ctx.fill();

        // Label pill
        if (showLabels) {
          const labelText = `#${det.onion_index} ${activeClass} ${
            showConfidence ? `(${Math.round(det.confidence * 100)}%)` : ''
          }`;
          const sizeText = `${det.diameter_mm}mm`;

          ctx.font = 'bold 13px Inter, sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const pillHeight = 22;

          ctx.fillStyle = isSelected ? '#1E293B' : colors.stroke;
          ctx.fillRect(bx, Math.max(0, by - pillHeight), textWidth + 14, pillHeight);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, bx + 7, Math.max(15, by - 6));

          // Diameter pill bottom
          ctx.font = '11px JetBrains Mono, monospace';
          const sizeWidth = ctx.measureText(sizeText).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(bx, by + bh, sizeWidth + 10, 18);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(sizeText, bx + 5, by + bh + 13);
        }

        // Review flag badge
        if (det.needs_review) {
          ctx.beginPath();
          ctx.arc(bx + bw - 8, by + 8, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#EAB308';
          ctx.fill();
        }
      });
    };
  }, [imageUrl, detections, showBoxes, showLabels, showConfidence, filterClass, selectedDetection]);

  // Handle canvas click to select onion detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / (rect.width * zoom);
    const clickY = (e.clientY - rect.top) / (rect.height * zoom);

    // Find clicked detection
    const clicked = detections.find(d => {
      return (
        clickX >= d.bbox_x &&
        clickX <= d.bbox_x + d.bbox_w &&
        clickY >= d.bbox_y &&
        clickY <= d.bbox_y + d.bbox_h
      );
    });

    if (clicked) {
      setSelectedDetection(clicked);
      setOverrideClass(clicked.inspector_override_class || clicked.class_name);
      setOverrideNotes(clicked.inspector_notes || '');
    } else {
      setSelectedDetection(null);
    }
  };

  const handleSaveOverride = () => {
    if (selectedDetection && onOverrideDetection) {
      onOverrideDetection(selectedDetection.onion_index, overrideClass, overrideNotes);
      setSelectedDetection(null);
    }
  };

  const summary = detections.reduce(
    (acc, d) => {
      const cls = (d.inspector_override_class || d.class_name).toLowerCase();
      acc.total += 1;
      if (cls === 'healthy') acc.healthy += 1;
      else if (cls === 'rotten') acc.rotten += 1;
      else if (cls === 'damaged') acc.damaged += 1;
      else if (cls === 'sprouted') acc.sprouted += 1;
      else if (cls === 'undersized') acc.undersized += 1;
      if (d.needs_review) acc.needs_review += 1;
      return acc;
    },
    { total: 0, healthy: 0, rotten: 0, damaged: 0, sprouted: 0, undersized: 0, needs_review: 0 }
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Defect Filters:
          </span>
          <div className="flex items-center gap-1">
            {['ALL', 'Healthy', 'Rotten', 'Damaged', 'Sprouted', 'Undersized'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterClass(cat)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  filterClass === cat
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & Layer Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setZoom(z => Math.max(0.7, z - 0.2))}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Reset View"
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 border-l border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
              showBoxes
                ? 'bg-forest-800/80 border-forest-600 text-forest-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Boxes
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
              showLabels
                ? 'bg-forest-800/80 border-forest-600 text-forest-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Labels
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 overflow-hidden flex items-center justify-center min-h-[420px] max-h-[560px] cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxWidth: '100%',
            height: 'auto',
          }}
          className="shadow-2xl rounded"
        />

        {/* Click hint tooltip */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur text-slate-300 px-3 py-1.5 rounded-md text-xs border border-slate-800 pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Click any onion bounding box to inspect size or correct classification</span>
        </div>
      </div>

      {/* Interactive Detection Override Drawer / Modal */}
      {selectedDetection && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forest-100 text-forest-800 font-bold flex items-center justify-center font-mono border border-forest-300">
                #{selectedDetection.onion_index}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Bulb #{selectedDetection.onion_index} Characteristics
                  {selectedDetection.needs_review && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold">
                      Needs Verification
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Calibrated Diameter: <strong>{selectedDetection.diameter_mm} mm</strong> • AI Confidence: <strong>{Math.round(selectedDetection.confidence * 100)}%</strong> • Initial: {selectedDetection.class_name}
                </p>
              </div>
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <label className="text-xs font-medium text-slate-600">Inspector Decision:</label>
                <select
                  value={overrideClass}
                  onChange={e => setOverrideClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-forest-600"
                >
                  <option value="Healthy">Healthy (Sound Bulb)</option>
                  <option value="Undersized">Undersized (&lt; 45mm)</option>
                  <option value="Damaged">Damaged (Mechanical/Skin)</option>
                  <option value="Sprouted">Sprouted (Green Shoot)</option>
                  <option value="Rotten">Rotten / Fungal Decay</option>
                </select>

                <input
                  type="text"
                  placeholder="Verification note (optional)"
                  value={overrideNotes}
                  onChange={e => setOverrideNotes(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white flex-1 md:w-48"
                />

                <button
                  onClick={handleSaveOverride}
                  className="px-3.5 py-1.5 bg-forest-800 hover:bg-forest-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Verification
                </button>
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Chips Bar */}
      <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Sample Total</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{summary.total} Bulbs</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <span className="text-forest-700 font-semibold text-[10px] block">Healthy</span>
            <span className="text-sm font-bold text-forest-800 font-mono">{summary.healthy}</span>
          </div>
          <div>
            <span className="text-blue-700 font-semibold text-[10px] block">Undersized</span>
            <span className="text-sm font-bold text-blue-800 font-mono">{summary.undersized}</span>
          </div>
          <div>
            <span className="text-orange-700 font-semibold text-[10px] block">Damaged</span>
            <span className="text-sm font-bold text-orange-800 font-mono">{summary.damaged}</span>
          </div>
          <div>
            <span className="text-lime-800 font-semibold text-[10px] block">Sprouted</span>
            <span className="text-sm font-bold text-lime-900 font-mono">{summary.sprouted}</span>
          </div>
          <div>
            <span className="text-red-700 font-semibold text-[10px] block">Rotten</span>
            <span className="text-sm font-bold text-red-800 font-mono">{summary.rotten}</span>
          </div>
        </div>

        {summary.needs_review > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{summary.needs_review} bulb{summary.needs_review > 1 ? 's' : ''} flagged for inspector confirmation</span>
          </div>
        )}
      </div>
    </div>
  );
};
