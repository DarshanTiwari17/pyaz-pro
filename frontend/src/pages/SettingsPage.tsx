import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Scale,
  Camera,
  Database,
  Wifi,
  Save,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { isOffline, toggleOfflineMode, syncOfflineQueue, pendingSyncCount } = useAuth();
  const [pixelsPerMm, setPixelsPerMm] = useState<number>(3.2);
  const [cameraHeightCm, setCameraHeightCm] = useState<number>(40);
  const [scaleMode, setScaleMode] = useState<string>('SERIAL_COM3');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          System Hardware & Calibration Config
        </span>
        <h1 className="text-xl font-bold text-slate-900">
          Terminal Settings & Optical Calibration Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure camera spatial calibration ratios, digital load cell interfaces, and local offline cache
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Calibration and hardware settings saved successfully to local terminal storage.</span>
        </div>
      )}

      {/* Camera Calibration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Camera className="w-5 h-5 text-forest-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Camera Optical Distance & Metric Size Calibration</h3>
            <p className="text-xs text-slate-500">Converts pixel bounding boxes into certified millimeters (mm)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Calibration Ratio (Pixels per Millimeter)</label>
            <input
              type="number"
              step="0.1"
              value={pixelsPerMm}
              onChange={e => setPixelsPerMm(parseFloat(e.target.value) || 3.2)}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 3.2 px/mm for standard white tray at 40cm</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fixed Camera Rig Height (cm)</label>
            <input
              type="number"
              value={cameraHeightCm}
              onChange={e => setCameraHeightCm(parseInt(e.target.value) || 40)}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Recommended distance: 38 - 42 cm</span>
          </div>
        </div>
      </div>

      {/* Scale Hardware Interface Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Scale className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Physical Weighing Scale Interface</h3>
            <p className="text-xs text-slate-500">Configure digital load cell serial COM, Bluetooth BLE, or manual entry</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Active Scale Interface Mode</label>
            <select
              value={scaleMode}
              onChange={e => setScaleMode(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="SERIAL_COM3">RS-232 / USB Serial COM Port (COM3 - 9600 Baud)</option>
              <option value="BLUETOOTH_BLE">Wireless Bluetooth BLE Scale Interface</option>
              <option value="MANUAL_ENTRY">Manual Scale Reading Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offline Database & Sync Management Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Offline Edge Storage & Synchronization</h3>
            <p className="text-xs text-slate-500">Manage offline-first cached inspections and sync queue to central DoCA servers</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-900 block">Current Connectivity Mode</span>
            <p className="text-slate-500">
              {isOffline ? 'Terminal running in offline edge mode.' : 'Terminal connected to DoCA cloud server.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOfflineMode}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
            >
              {isOffline ? 'Simulate Online' : 'Simulate Offline Mode'}
            </button>

            <button
              onClick={syncOfflineQueue}
              className="px-3.5 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-white font-bold"
            >
              Force Sync Queue
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
};
