import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OfflineBanner } from './components/common/OfflineBanner';

// Pages
import { Dashboard } from './pages/Dashboard';
import { NewInspection } from './pages/NewInspection';
import { InspectionsList } from './pages/InspectionsList';
import { LotsPage } from './pages/LotsPage';
import { QualityPassportPage } from './pages/QualityPassportPage';
import { ReportsPage } from './pages/ReportsPage';
import { StorageMonitoringPage } from './pages/StorageMonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReinspectionPage } from './pages/ReinspectionPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProcurementRulesPage } from './pages/ProcurementRulesPage';
import { UsersCentersPage } from './pages/UsersCentersPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedLotId, setSelectedLotId] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavigate = (tab: string, lotId?: string) => {
    setCurrentTab(tab);
    if (lotId) setSelectedLotId(lotId);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'new-inspection':
        return <NewInspection onInspectionFinished={(lotId) => handleNavigate('passport', lotId)} />;
      case 'inspections':
        return <InspectionsList onNavigate={handleNavigate} />;
      case 'lots':
        return <LotsPage onNavigate={handleNavigate} />;
      case 'passport':
        return <QualityPassportPage lotId={selectedLotId} onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage />;
      case 'storage':
        return <StorageMonitoringPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'reinspection':
        return <ReinspectionPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'rules':
        return <ProcurementRulesPage />;
      case 'users':
        return <UsersCentersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:min-h-0">
      <div className="no-print print:hidden">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <OfflineBanner />
      </div>

      <div className="flex-1 flex print:block">
        <div className="no-print print:hidden">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleNavigate}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        </div>
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-full print:overflow-visible print:block">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
