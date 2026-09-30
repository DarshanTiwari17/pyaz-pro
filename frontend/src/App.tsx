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

  const handleNavigate = (tab: string, lotId?: string) => {
    setCurrentTab(tab);
    if (lotId) setSelectedLotId(lotId);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <OfflineBanner />

      <div className="flex-1 flex">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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
