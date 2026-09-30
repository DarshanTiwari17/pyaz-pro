import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, pendingSyncCount, toggleOfflineMode, syncOfflineQueue } = useAuth();

  if (!isOffline && pendingSyncCount === 0) return null;

  return (
    <div className={`px-4 py-2 text-xs md:text-sm font-medium border-b flex items-center justify-between transition-colors ${
      isOffline ? 'bg-amber-500 text-amber-950 border-amber-600' : 'bg-emerald-600 text-white border-emerald-700'
    }`}>
      <div className="flex items-center gap-2 max-w-4xl">
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-950" />
            <span>
              <strong>Procurement Center Offline Mode Active:</strong> Inspections, local camera captures, and AI measurements are cached securely on this terminal.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Central Connectivity Restored:</strong> {pendingSyncCount} records pending sync to DoCA Cloud.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={syncOfflineQueue}
          className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-current text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Queue ({pendingSyncCount})
        </button>
        <button
          onClick={toggleOfflineMode}
          className="underline text-xs opacity-90 hover:opacity-100"
        >
          {isOffline ? 'Simulate Reconnect' : 'Simulate Offline'}
        </button>
      </div>
    </div>
  );
};
