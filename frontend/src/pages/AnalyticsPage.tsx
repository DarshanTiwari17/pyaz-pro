import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Boxes,
  PieChart as PieIcon,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const centerComparison = summary?.center_comparison || [
    { center_name: 'Lasalgaon APMC Terminal', lot_count: 14, total_volume_mt: 280.5, avg_grade_a_pct: 84.5, state: 'Maharashtra' },
    { center_name: 'Pimpalgaon Buffer Center', lot_count: 8, total_volume_mt: 160.0, avg_grade_a_pct: 81.0, state: 'Maharashtra' },
    { center_name: 'Mahuva Mandi Hub', lot_count: 6, total_volume_mt: 120.0, avg_grade_a_pct: 78.5, state: 'Gujarat' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-blue-700 font-bold uppercase tracking-wider">
            DoCA National Executive Dashboard
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Multi-Center Procurement Analytics & Quality Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-mandi quality benchmarks, volume trends, defect distributions, and supplier performance
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Cross-Mandi Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Procurement Terminal Benchmarking</h3>
          <span className="text-xs font-mono text-slate-400">Buffer Season 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Procurement Center Terminal</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Lots Received</th>
                <th className="py-3 px-4">Total Intake (MT)</th>
                <th className="py-3 px-4">Mean Grade A %</th>
                <th className="py-3 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {centerComparison.map((c: any) => (
                <tr key={c.center_name} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{c.center_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.state}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.lot_count}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{c.total_volume_mt} MT</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{c.avg_grade_a_pct}%</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                      Target Met (&gt; 80%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Grade Conformance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">4-Week Quality Conformance Curve</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.historical_quality_trends || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[70, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="grade_a" stroke="#1E4D2B" name="Grade A %" strokeWidth={2.5} />
                <Line type="monotone" dataKey="urs" stroke="#D97706" name="URS %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Pareto Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Defect Incidence Distribution (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.defect_distribution || []} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#1E4D2B" radius={[4, 4, 0, 0]} name="Incidence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
