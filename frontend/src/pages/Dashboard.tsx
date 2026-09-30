import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Weight,
  Award,
  AlertCircle,
  Warehouse,
  PlusCircle,
  RefreshCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { api } from '../services/api';
import { Lot, Inspection } from '../types';
import { Badge } from '../components/common/Badge';

interface DashboardProps {
  onNavigate: (tab: string, lotId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [recentLots, setRecentLots] = useState<Lot[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, lots] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getLots(),
      ]);
      setSummaryData(sum);
      setRecentLots(lots);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = summaryData?.kpis || {
    total_lots_inspected: 24,
    total_quantity_mt: 480.5,
    avg_grade_a_pct: 82.4,
    avg_urs_pct: 17.6,
    reinspection_count: 2,
    high_risk_storage_lots: 1,
  };

  const filteredLots = recentLots.filter(l => {
    const matchesSearch =
      l.lot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.supplier_name && l.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Context */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-forest-700/80 px-2 py-0.5 rounded text-forest-200 border border-forest-600">
              MANDI INTAKE TERMINAL ACTIVE
            </span>
            <span className="text-xs text-slate-300">• Lasalgaon Buffer Terminal #01</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Onion Quality & Procurement Intelligence</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Objective computer vision grading, calibrated scale measurements, and DoCA Agmarknet standard compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-inspection')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold rounded-xl text-sm shadow-md transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Start New Inspection
          </button>
          <button
            onClick={loadData}
            title="Refresh Metrics"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Lots Inspected</span>
            <Boxes className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{kpis.total_lots_inspected}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 3 mandis</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Volume (MT)</span>
            <Weight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{kpis.total_quantity_mt} <span className="text-xs font-normal text-slate-500">MT</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Buffer Intake Target: 1,500 MT</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Avg Grade A</span>
            <Award className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-2xl font-black text-forest-800 font-mono">{kpis.avg_grade_a_pct}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Standard sound bulbs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Avg URS %</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{kpis.avg_urs_pct}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Fair average quality</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Reinspections</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-800 font-mono">{kpis.reinspection_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Disputes in review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Storage Risk</span>
            <Warehouse className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{kpis.high_risk_storage_lots} <span className="text-xs text-slate-400">Lots</span></div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">Elevated humidity bay</div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Quality Grade Classification</h3>
          <p className="text-xs text-slate-500 mb-4">Lot distribution based on DoCA Procurement Standard</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData?.grade_distribution || [
                    { name: 'Grade A', value: 18, color: '#1E4D2B' },
                    { name: 'URS', value: 5, color: '#D97706' },
                    { name: 'Rejected', value: 1, color: '#DC2626' },
                  ]}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(summaryData?.grade_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-medium mt-2">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1E4D2B]"></span> Grade A</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> URS</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> Rejected</div>
          </div>
        </div>

        {/* Defect Distribution Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Defect Distribution Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Incidence across all analyzed camera samples (%)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaryData?.defect_distribution || [
                  { name: 'Healthy', percentage: 82.5 },
                  { name: 'Undersized', percentage: 7.2 },
                  { name: 'Damaged', percentage: 5.1 },
                  { name: 'Sprouted', percentage: 3.4 },
                  { name: 'Rotten', percentage: 1.8 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Incidence']} />
                <Bar dataKey="percentage" fill="#1E4D2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Grade Trends Line */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">4-Week Intake Conformance</h3>
          <p className="text-xs text-slate-500 mb-4">Grade A percentage vs procurement volume</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={summaryData?.historical_quality_trends || [
                  { week: 'W1', grade_a: 81.2, volume_mt: 185 },
                  { week: 'W2', grade_a: 83.5, volume_mt: 240 },
                  { week: 'W3', grade_a: 79.8, volume_mt: 310 },
                  { week: 'W4', grade_a: 84.5, volume_mt: 420 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[70, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="grade_a" stroke="#1E4D2B" strokeWidth={2.5} dot={{ r: 4 }} name="Grade A %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-slate-400 mt-2 font-mono">
            Average Grade A Conformance Target: &gt; 80%
          </div>
        </div>
      </div>

      {/* Recent Inspections / Intake Lots Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Mandi Intake Lots</h3>
            <p className="text-xs text-slate-500">Live quality assessments, digital passports, and dispute flags</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Lot or Farmer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_STORAGE">In Storage</option>
              <option value="REINSPECTION_REQUESTED">Reinspection Requested</option>
              <option value="PENDING_INSPECTION">Pending Inspection</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Lot ID</th>
                <th className="py-3 px-4">Supplier / FPO</th>
                <th className="py-3 px-4">Intake Center</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Assigned Grade</th>
                <th className="py-3 px-4">Grade A %</th>
                <th className="py-3 px-4">URS %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLots.map(lot => (
                <tr key={lot.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {lot.lot_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{lot.supplier_name || 'Rameshwar FPO'}</div>
                    <div className="text-[10px] text-slate-400">{lot.variety}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {lot.center_name || 'Lasalgaon APMC'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    {lot.initial_quantity_mt} MT <span className="text-slate-400">({lot.bag_count} bags)</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {lot.current_grade ? (
                      <Badge type="grade" value={lot.current_grade} size="sm" />
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-forest-800">
                    {lot.grade_a_percentage ? `${lot.grade_a_percentage}%` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">
                    {lot.urs_percentage ? `${lot.urs_percentage}%` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge type="status" value={lot.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigate('passport', lot.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-forest-100 hover:text-forest-800 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        Passport
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
