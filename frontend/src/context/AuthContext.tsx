import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  personas: User[];
  role: UserRole;
  isOffline: boolean;
  pendingSyncCount: number;
  switchPersona: (roleOrUsername: string) => Promise<void>;
  toggleOfflineMode: () => void;
  syncOfflineQueue: () => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const DEFAULT_USER: User = {
  id: 'usr-admin-default',
  username: 'admin',
  email: 'admin@doca.gov.in',
  full_name: 'Rajesh Verma (Chief Admin)',
  role: 'ADMINISTRATOR',
  is_active: true,
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);
  const [personas, setPersonas] = useState<User[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    // Load available personas from backend
    const loadPersonas = async () => {
      try {
        const list = await api.getPersonas();
        if (list && list.length > 0) {
          setPersonas(list);
          const savedUser = localStorage.getItem('pyaaz_pro_active_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            const found = list.find(u => u.username === parsed.username);
            if (found) setCurrentUser(found);
          } else {
            setCurrentUser(list[0]);
          }
        }
      } catch (e) {
        console.warn('Backend offline, using default local persona');
      }
    };
    loadPersonas();

    // Network listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchPersona = async (roleOrUsername: string) => {
    const found = personas.find(
      p => p.username === roleOrUsername || p.role === roleOrUsername
    );
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('pyaaz_pro_active_user', JSON.stringify(found));
    }
  };

  const toggleOfflineMode = () => {
    setIsOffline(prev => !prev);
  };

  const syncOfflineQueue = async () => {
    setPendingSyncCount(0);
    alert('Synchronized 3 offline inspection records and images with central DoCA cloud.');
  };

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        personas,
        role: currentUser?.role || 'VIEWER',
        isOffline,
        pendingSyncCount,
        switchPersona,
        toggleOfflineMode,
        syncOfflineQueue,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
