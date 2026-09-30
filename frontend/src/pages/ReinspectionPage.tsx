import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock,
  ShieldAlert,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { Reinspection } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export const ReinspectionPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [reinspections, setReinspections] = useState<Reinspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReinsp, setSelectedReinsp] = useState<Reinspection | null>(null);

  // Decision state
  const [decisionGrade, setDecisionGrade] = useState<string>('GRADE_A');
  const [decisionRemarks, setDecisionRemarks] = useState<string>('');
  const [decisionAction, setDecisionAction] = useState<string>('APPROVED_NEW_GRADE');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getReinspections();
      setReinspections(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSupervisorSubmit = async () => {
    if (!selectedReinsp) return;
    try {
      await api.decideReinspection(
        selectedReinsp.id,
        {
          status: decisionAction,
          new_grade: decisionAction === 'APPROVED_NEW_GRADE' ? decisionGrade : undefined,
          supervisor_remarks: decisionRemarks || 'Physical caliper secondary check confirmed standard bulb neck measurement.',
        },
        currentUser?.id || 'usr-sup-1'
      );
      setSelectedReinsp(null);
      loadData();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    }
  };

  const isSupervisorOrAdmin = role === 'SUPERVISOR' || role === 'ADMINISTRATOR';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-700 font-bold uppercase tracking-wider">
            Fair Procurement Transparency • Mandi Dispute Resolution
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Reinspection & Supplier Dispute Resolution Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record preserves both original AI findings and secondary re-test verification
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Reinspections Queue Table */}
      {reinspections.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending reinspection disputes"
          description="All mandi intake lots have been resolved without open supplier disputes or borderline flags."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Dispute & Borderline Reinspection Queue</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dispute #</th>
                  <th className="py-3 px-4">Lot ID</th>
                  <th className="py-3 px-4">Dispute Reason</th>
                  <th className="py-3 px-4">Original AI Grade</th>
                  <th className="py-3 px-4">New Ruled Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reinspections.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.reinspection_number}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{r.lot_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.reason_code.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{r.reason_description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge type="grade" value={r.original_grade} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {r.new_grade ? <Badge type="grade" value={r.new_grade} size="sm" /> : <span className="text-slate-400 font-mono">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge type="status" value={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'PENDING_REVIEW' && isSupervisorOrAdmin ? (
                        <button
                          onClick={() => setSelectedReinsp(r)}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs rounded-lg transition"
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supervisor Review & Signoff Modal */}
      {selectedReinsp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-purple-700 font-bold">
                  Supervisor Adjudication
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedReinsp.reinspection_number} • {selectedReinsp.lot_number}
                </h3>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p><strong>Dispute Reason:</strong> {selectedReinsp.reason_code.replace(/_/g, ' ')}</p>
              <p className="text-slate-600"><strong>Contention Notes:</strong> {selectedReinsp.reason_description}</p>
              <p><strong>Original AI Grade:</strong> {selectedReinsp.original_grade}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supervisor Decision Action</label>
                <select
                  value={decisionAction}
                  onChange={e => setDecisionAction(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="APPROVED_NEW_GRADE">Approve Re-graded Classification (Override)</option>
                  <option value="UPHELD_ORIGINAL">Upheld Original AI Grade Standard</option>
                  <option value="REJECTED">Reject Lot Completely (Safety Defect)</option>
                </select>
              </div>

              {decisionAction === 'APPROVED_NEW_GRADE' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Approved Grade</label>
                  <select
                    value={decisionGrade}
                    onChange={e => setDecisionGrade(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="GRADE_A">Grade A (Standard)</option>
                    <option value="URS">URS (Under-Sized / Fair)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Supervisor Remarks & Caliper Verification Note</label>
                <textarea
                  rows={3}
                  value={decisionRemarks}
                  onChange={e => setDecisionRemarks(e.target.value)}
                  placeholder="e.g. Conducted 10-bag re-sampling with physical vernier caliper check. Confirmed average diameter 46.2mm meeting Grade A."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReinsp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSupervisorSubmit}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg"
              >
                Sign & Finalize Adjudication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
