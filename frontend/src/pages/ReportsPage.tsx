import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle,
  Search,
  RefreshCw,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getReports();
      setReports(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewReport = async (reportId: string) => {
    try {
      const detail = await api.getReportDetail(reportId);
      setSelectedReport(detail);
    } catch (err: any) {
      alert(`Error fetching report detail: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-forest-700 font-bold uppercase tracking-wider">
            Official Quality Certificates • Tamper Integrity
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Generated Quality Reports & Procurement Certificates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready digital certificates with cryptographic SHA-256 integrity checksums
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Certificate Registry</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Lot ID</th>
                <th className="py-3 px-4">Farmer / Mandi FPO</th>
                <th className="py-3 px-4">Terminal</th>
                <th className="py-3 px-4">Grade Result</th>
                <th className="py-3 px-4">Grade A %</th>
                <th className="py-3 px-4">Tamper Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.report_number}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">{r.lot_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.supplier_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.center_name}</td>
                  <td className="py-3.5 px-4">
                    <Badge type="grade" value={r.grade_result} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{r.grade_a_percentage}%</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Tamper-Verified
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleViewReport(r.id)}
                      className="px-3 py-1 bg-slate-100 hover:bg-forest-100 hover:text-forest-900 text-slate-700 font-semibold rounded-lg text-xs transition"
                    >
                      View Certificate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Certificate Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8 print:p-0 print:border-none">
            {/* Gov Banner */}
            <div className="border-b-2 border-forest-800 pb-4 text-center space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 font-mono">
                Government of India • Ministry of Consumer Affairs
              </span>
              <h2 className="text-lg font-black text-slate-900 uppercase">
                Official Digital Onion Quality Certificate
              </h2>
              <p className="text-xs font-mono text-forest-800 font-bold">
                Standard: {selectedReport.rule_version}
              </p>
            </div>

            {/* Certificate Body */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium border border-slate-200 p-4 rounded-xl bg-slate-50">
              <div>
                <span className="text-slate-400 block text-[10px]">Certificate No.</span>
                <span className="font-mono font-bold text-slate-900">{selectedReport.report_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Lot Manifest</span>
                <span className="font-mono font-bold text-slate-900">{selectedReport.lot?.lot_number} ({selectedReport.lot?.quantity_mt} MT)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Farmer / Mandi FPO</span>
                <span className="text-slate-900 font-bold">{selectedReport.supplier?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Intake Procurement Terminal</span>
                <span className="text-slate-900 font-bold">{selectedReport.center?.name}</span>
              </div>
            </div>

            {/* Assessment Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Grading & Quality Analysis</h4>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">Grade Classification</span>
                  <span className="font-black text-sm text-forest-900">{selectedReport.inspection?.grade_result}</span>
                </div>
                <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">Grade A Ratio</span>
                  <span className="font-black text-sm text-forest-900">{selectedReport.inspection?.grade_a_percentage}%</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-slate-500 block text-[10px]">URS Tolerance Share</span>
                  <span className="font-black text-sm text-amber-900">{selectedReport.inspection?.urs_percentage}%</span>
                </div>
              </div>
            </div>

            {/* Tamper Seal Bar */}
            <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">SHA-256 DIGITAL SEAL:</span>
                <span className="font-bold text-amber-400 truncate max-w-sm block">{selectedReport.report_hash}</span>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 no-print">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Official Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
