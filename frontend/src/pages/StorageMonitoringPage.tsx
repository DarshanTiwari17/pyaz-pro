import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Thermometer,
  Droplets,
  AlertTriangle,
  PlusCircle,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { api } from '../services/api';
import { StorageReading, Lot } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const StorageMonitoringPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [readings, setReadings] = useState<StorageReading[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New reading form state
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [warehouseBay, setWarehouseBay] = useState<string>('Bay-C04');
  const [temperature, setTemperature] = useState<number>(28.5);
  const [relativeHumidity, setRelativeHumidity] = useState<number>(72.0);
  const [rotIncidence, setRotIncidence] = useState<number>(1.2);
  const [sproutIncidence, setSproutIncidence] = useState<number>(0.5);
  const [weightLoss, setWeightLoss] = useState<number>(2.0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, lList] = await Promise.all([api.getStorageReadings(), api.getLots()]);
      setReadings(rList);
      setLots(lList);
      if (lList.length > 0) setSelectedLotId(lList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddReading = async () => {
    if (!selectedLotId) return;
    try {
      await api.addStorageReading(
        {
          lot_id: selectedLotId,
          warehouse_bay: warehouseBay,
          temperature_c: temperature,
          relative_humidity_pct: relativeHumidity,
          rot_incidence_pct: rotIncidence,
          sprouting_incidence_pct: sproutIncidence,
          weight_loss_pct: weightLoss,
        },
        currentUser?.id || 'usr-warehouse-1'
      );
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error submitting reading: ${err.message}`);
    }
  };

  const chartData = readings.map((r, i) => ({
    time: new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    temp: r.temperature_c,
    humidity: r.relative_humidity_pct,
    rot: r.rot_incidence_pct,
    sprout: r.sprouting_incidence_pct,
  })).reverse();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-amber-700 font-bold uppercase tracking-wider">
            Post-Harvest Preservation • Spoilage Risk Model
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Buffer Storage Quality & Deterioration Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Microclimate temperature/RH sensor tracking, biological rot/sprouting acceleration, and risk mitigation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> Log Sensor Reading
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sensor Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Avg Godown Temp</span>
            <Thermometer className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {readings[0]?.temperature_c || 28.5}°C
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Safe zone: 25-30°C</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Relative Humidity</span>
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {readings[0]?.relative_humidity_pct || 72.0}%
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Warning: &gt;75% accelerates rot</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Mean Rot Incidence</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">
            {readings[0]?.rot_incidence_pct || 1.2}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tolerance max: 2.0%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Deterioration Risk</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <Badge type="risk" value={readings[0]?.deterioration_risk_level || 'LOW'} size="md" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Explainable kinetics</div>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Warehouse Sensor Telemetry Time-Series</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temp" stroke="#D97706" name="Temperature (°C)" strokeWidth={2} />
              <Line type="monotone" dataKey="humidity" stroke="#2563EB" name="Humidity (%)" strokeWidth={2} />
              <Line type="monotone" dataKey="rot" stroke="#DC2626" name="Rot Incidence (%)" strokeWidth={2} />
              <Line type="monotone" dataKey="sprout" stroke="#16A34A" name="Sprouting (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storage Readings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recorded Bay Telemetry & Operator Actions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Warehouse Bay</th>
                <th className="py-3 px-4">Temp (°C)</th>
                <th className="py-3 px-4">RH (%)</th>
                <th className="py-3 px-4">Rot %</th>
                <th className="py-3 px-4">Sprouting %</th>
                <th className="py-3 px-4">Weight Loss %</th>
                <th className="py-3 px-4">Assessed Risk</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.warehouse_bay}</td>
                  <td className="py-3.5 px-4 font-mono">{r.temperature_c}°C</td>
                  <td className="py-3.5 px-4 font-mono">{r.relative_humidity_pct}%</td>
                  <td className="py-3.5 px-4 font-mono text-red-700 font-semibold">{r.rot_incidence_pct}%</td>
                  <td className="py-3.5 px-4 font-mono text-lime-800">{r.sprouting_incidence_pct}%</td>
                  <td className="py-3.5 px-4 font-mono">{r.weight_loss_pct}%</td>
                  <td className="py-3.5 px-4">
                    <Badge type="risk" value={r.deterioration_risk_level} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(r.recorded_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sensor Reading Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Log Warehouse Microclimate & Biological Reading</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Lot in Storage</label>
                <select
                  value={selectedLotId}
                  onChange={e => setSelectedLotId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {lots.map(l => (
                    <option key={l.id} value={l.id}>{l.lot_number} ({l.variety})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Warehouse Bay ID</label>
                  <input
                    type="text"
                    value={warehouseBay}
                    onChange={e => setWarehouseBay(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ambient Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Relative Humidity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={relativeHumidity}
                    onChange={e => setRelativeHumidity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rot Incidence (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rotIncidence}
                    onChange={e => setRotIncidence(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-red-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sprouting Incidence (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sproutIncidence}
                    onChange={e => setSproutIncidence(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weight Loss (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightLoss}
                    onChange={e => setWeightLoss(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReading}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white text-xs font-semibold rounded-lg"
              >
                Submit Sensor Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
