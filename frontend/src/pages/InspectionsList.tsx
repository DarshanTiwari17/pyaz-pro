import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  PlusCircle,
  FileCheck,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Inspection } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface InspectionsListProps {
  onNavigate: (tab: string, lotId?: string) => void;
}

export const InspectionsList: React.FC<InspectionsListProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getInspections();
      setInspections(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = inspections.filter(i => {
    const matchesSearch =
      i.inspection_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.lot_number && i.lot_number.toLowerCase().includes(search.toLowerCase())) ||
      (i.supplier_name && i.supplier_name.toLowerCase().includes(search.toLowerCase()));
    const matchesGrade = selectedGrade === 'ALL' || i.grade_result === selectedGrade;
    const matchesStatus = selectedStatus === 'ALL' || i.status === selectedStatus;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Procurement Center Inspections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all AI vision assessments, calibrated weights, and finalized quality grades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-inspection')}
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> New Inspection
          </button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Inspection #, Lot ID, Farmer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-forest-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50"
          >
            <option value="ALL">All Grades</option>
            <option value="GRADE_A">Grade A</option>
            <option value="URS">URS (Under-Grade)</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50"
          >
            <option value="ALL">All Status</option>
            <option value="FINALIZED">Finalized</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="REINSPECTED">Reinspected</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No inspections found"
          description="Create your first guided inspection to begin objective AI quality assessment and generate a digital passport."
          actionLabel="Start New Inspection"
          onAction={() => onNavigate('new-inspection')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Inspection #</th>
                  <th className="py-3 px-4">Lot ID & Variety</th>
                  <th className="py-3 px-4">Center & Inspector</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Defect Profile</th>
                  <th className="py-3 px-4">Grade Result</th>
                  <th className="py-3 px-4">Grade A %</th>
                  <th className="py-3 px-4">URS %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(insp => (
                  <tr key={insp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {insp.inspection_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{insp.lot_number || 'LOT-2026-NSK-00101'}</div>
                      <div className="text-[10px] text-slate-400">{insp.supplier_name || 'Rameshwar FPO'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{insp.center_name || 'Lasalgaon Terminal'}</div>
                      <div className="text-[10px] text-slate-400">{insp.inspector_name || 'Sanjay Sharma'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {Math.round((insp.confidence_score || 0.94) * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span title="Healthy" className="px-1.5 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200">
                          H:{insp.healthy_count}
                        </span>
                        <span title="Undersized" className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          U:{insp.undersized_count}
                        </span>
                        <span title="Rotten" className="px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                          R:{insp.rotten_count}
                        </span>
                        <span title="Damaged" className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                          D:{insp.damaged_count}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {insp.grade_result ? (
                        <Badge type="grade" value={insp.grade_result} size="sm" />
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">
                      {insp.grade_a_percentage}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {insp.urs_percentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge type="status" value={insp.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('passport', insp.lot_id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-forest-100 hover:text-forest-800 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1 ml-auto"
                      >
                        <FileCheck className="w-3 h-3" />
                        Passport
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
