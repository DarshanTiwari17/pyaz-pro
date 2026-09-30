import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  Boxes,
  QrCode,
  FileText,
  Warehouse,
  BarChart3,
  Cpu,
  RefreshCw,
  History,
  Users,
  Sliders,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { role } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR', 'WAREHOUSE_OPERATOR', 'VIEWER'],
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: ClipboardList,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR', 'VIEWER'],
    },
    {
      id: 'new-inspection',
      label: 'New Inspection',
      icon: Camera,
      roles: ['ADMINISTRATOR', 'INSPECTOR'],
      badge: 'Core',
    },
    {
      id: 'lots',
      label: 'Lots & Suppliers',
      icon: Boxes,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR', 'VIEWER'],
    },
    {
      id: 'passport',
      label: 'Quality Passport',
      icon: QrCode,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR', 'VIEWER'],
    },
    {
      id: 'reports',
      label: 'Reports & Certs',
      icon: FileText,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR', 'VIEWER'],
    },
    {
      id: 'storage',
      label: 'Storage Monitoring',
      icon: Warehouse,
      roles: ['ADMINISTRATOR', 'WAREHOUSE_OPERATOR', 'SUPERVISOR'],
      badge: 'Sensors',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      roles: ['ADMINISTRATOR', 'SUPERVISOR'],
    },
    {
      id: 'reinspection',
      label: 'Reinspection & Disputes',
      icon: RefreshCw,
      roles: ['ADMINISTRATOR', 'INSPECTOR', 'SUPERVISOR'],
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      roles: ['ADMINISTRATOR', 'SUPERVISOR'],
    },
    {
      id: 'rules',
      label: 'Procurement Rules',
      icon: Sliders,
      roles: ['ADMINISTRATOR', 'SUPERVISOR'],
    },
    {
      id: 'users',
      label: 'Users & Centers',
      icon: Users,
      roles: ['ADMINISTRATOR'],
    },
    {
      id: 'settings',
      label: 'System & Hardware',
      icon: SettingsIcon,
      roles: ['ADMINISTRATOR', 'INSPECTOR'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Procurement Operations
        </p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                isActive
                  ? 'bg-forest-50 text-forest-800 font-semibold border border-forest-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-forest-700 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-forest-200 text-forest-900' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine v2.4.1</span>
          <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded">Agmarknet R4</span>
        </div>
      </div>
    </aside>
  );
};
