import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { User, ProcurementCenter } from '../types';

export const UsersCentersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, cList] = await Promise.all([api.getUsers(), api.getCenters()]);
      setUsers(uList);
      setCenters(cList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-700 font-bold uppercase tracking-wider">
            RBAC & Mandi Terminal Management
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Users, Roles & Procurement Centers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authorization for inspectors, supervisors, warehouse operators, and auditors
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Procurement Centers Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-forest-700" /> Authorized Procurement Terminals & Buffer Hubs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {centers.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">{c.code}</span>
                <span className="px-2 py-0.5 rounded bg-forest-50 text-forest-800 text-[11px] font-bold border border-forest-200">
                  {c.capacity_mt} MT Capacity
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
              <p className="text-xs text-slate-500">{c.address || `${c.district}, ${c.state}`}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Registered System Users & Role Assignments</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Assigned Role (RBAC)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-800 font-bold">{u.username}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
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
