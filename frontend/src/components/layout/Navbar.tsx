import React, { useState } from 'react';
import { UserCheck, ShieldCheck, ChevronDown, Building2, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { currentUser, personas, role, switchPersona, isOffline } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleColors: Record<UserRole, string> = {
    ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-300',
    INSPECTOR: 'bg-forest-100 text-forest-800 border-forest-300',
    SUPERVISOR: 'bg-blue-100 text-blue-800 border-blue-300',
    WAREHOUSE_OPERATOR: 'bg-amber-100 text-amber-900 border-amber-300',
    VIEWER: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Gov Banner */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center shadow-inner">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-forest-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">PYAAZ-PRO</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-forest-800/80 text-forest-200 border border-forest-600 font-mono">
                  {/* PS ID: 26031 - Project Reference */}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Dept. of Consumer Affairs • Ministry of Consumer Affairs, Food & Public Distribution
              </p>
            </div>
          </div>

          {/* Right Center Details & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Center Tag */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-forest-400" />
              <span>Lasalgaon APMC Terminal (MH-NSK)</span>
            </div>

            {/* Offline/Online Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 border border-slate-700">
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 hidden md:inline">Offline (Edge DB)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 hidden md:inline">DoCA Cloud Sync</span>
                </>
              )}
            </div>

            {/* Persona Quick Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition"
              >
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {currentUser?.full_name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    {role}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded text-[11px] font-bold border ${roleColors[role]}`}>
                  {role.replace('_', ' ')}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role Persona (RBAC Testing)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Preview UI permissions for field inspectors, supervisors, and warehouse staff.
                    </p>
                  </div>
                  <div className="py-1">
                    {personas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.username);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition ${
                          currentUser?.username === p.username ? 'bg-slate-800/80 font-medium' : ''
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400">{p.email}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase border ${roleColors[p.role]}`}>
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
