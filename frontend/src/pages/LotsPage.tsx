import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  PlusCircle,
  FileCheck2,
  RefreshCw,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { Lot } from '../types';
import { Badge } from '../components/common/Badge';

interface LotsPageProps {
  onNavigate: (tab: string, lotId?: string) => void;
}

export const LotsPage: React.FC<LotsPageProps> = ({ onNavigate }) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getLots();
      setLots(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = lots.filter(
    l =>
      l.lot_number.toLowerCase().includes(search.toLowerCase()) ||
      (l.supplier_name && l.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
      l.variety.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-forest-700 font-bold uppercase tracking-wider">
            Intake Registry • Mandi Lots
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Onion Lots & Mandi Supplier Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full inventory of incoming buffer lots, bag counts, tonnage, and linked Quality Passports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-inspection')}
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> Intake New Lot
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Lot ID, Farmer FPO, or Variety..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent border-none outline-hidden"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Lot ID</th>
                <th className="py-3 px-4">Supplier / Farmer FPO</th>
                <th className="py-3 px-4">Crop Variety</th>
                <th className="py-3 px-4">Intake Center</th>
                <th className="py-3 px-4">Quantity (MT)</th>
                <th className="py-3 px-4">Bags</th>
                <th className="py-3 px-4">Assigned Grade</th>
                <th className="py-3 px-4">Lot Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{l.lot_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{l.supplier_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{l.variety}</td>
                  <td className="py-3.5 px-4 text-slate-600">{l.center_name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{l.initial_quantity_mt} MT</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{l.bag_count}</td>
                  <td className="py-3.5 px-4">
                    {l.current_grade ? (
                      <Badge type="grade" value={l.current_grade} size="sm" />
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge type="status" value={l.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate('passport', l.id)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-forest-100 hover:text-forest-800 text-slate-700 font-semibold text-[11px] transition flex items-center gap-1 ml-auto"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      Passport
                    </button>
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
