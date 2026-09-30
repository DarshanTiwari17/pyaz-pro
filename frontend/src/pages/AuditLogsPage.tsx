import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  UserCheck,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getAuditLogs();
      setLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter(
    l =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_name && l.user_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
            Immutable Audit Trail • Statutory Traceability
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            System Audit Logs & Regulatory Event Stream
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed timeline of all user overrides, rule modifications, and procurement decisions
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit logs by action, description, or user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent border-none outline-hidden"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                    {l.user_name || 'System Automation'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {l.entity_type}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-800 max-w-md truncate">
                    {l.description}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {l.ip_address}
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
