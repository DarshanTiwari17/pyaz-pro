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
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, mobileOpen, onCloseMobile }) => {
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

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Procurement Operations
        </p>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
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
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
