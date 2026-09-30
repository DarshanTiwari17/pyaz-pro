import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { ProcurementRule } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProcurementRulesPage: React.FC = () => {
  const { role } = useAuth();
  const [rules, setRules] = useState<ProcurementRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getRules();
      setRules(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActivate = async (ruleId: string) => {
    try {
      await api.activateRule(ruleId);
      loadData();
    } catch (err: any) {
      alert(`Error activating standard: ${err.message}`);
    }
  };

  const isSupervisorOrAdmin = role === 'ADMINISTRATOR' || role === 'SUPERVISOR';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-forest-700 font-bold uppercase tracking-wider">
            Agmarknet / DoCA Standard Configurator
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Procurement Rules & Quality Tolerance Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable size thresholds, rot/defect limits, and Grade A / URS pricing boundaries
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map(r => (
          <div
            key={r.id}
            className={`p-6 rounded-2xl border-2 transition-all bg-white shadow-xs ${
              r.is_active
                ? 'border-forest-700 ring-2 ring-forest-100'
                : 'border-slate-200 opacity-90'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{r.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold">
                    {r.version}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.department}</p>
              </div>

              {r.is_active ? (
                <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" /> Active Standard
                </span>
              ) : isSupervisorOrAdmin ? (
                <button
                  onClick={() => handleActivate(r.id)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-forest-800 hover:text-white text-slate-700 text-xs font-semibold transition"
                >
                  Activate Rule
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Min Bulb Size (Grade A)</span>
                <span className="font-mono font-bold text-slate-900">&gt;= {r.min_size_mm} mm</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Max Rot Tolerance</span>
                <span className="font-mono font-bold text-red-700">&lt;= {r.max_rot_tolerance_pct}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Max Sprouting Tolerance</span>
                <span className="font-mono font-bold text-lime-800">&lt;= {r.max_sprout_tolerance_pct}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total Aggregate Defect</span>
                <span className="font-mono font-bold text-slate-900">&lt;= {r.max_total_defect_tolerance_pct}%</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div>
                <strong className="text-forest-900">Grade A Definition:</strong> {r.grade_a_definition}
              </div>
              <div>
                <strong className="text-amber-900">URS Definition:</strong> {r.urs_definition}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
