import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, getAccessToken, clearTokens } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const { setupRequired: needsSetup } = await api.checkStatus();
        setSetupRequired(needsSetup);

        if (!needsSetup && getAccessToken()) {
          await refreshUser();
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setUser(user);
    setSetupRequired(false);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const setup = useCallback(async (email: string, password: string) => {
    const { user } = await api.setup(email, password);
    setUser(user);
    setSetupRequired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setupRequired,
        login,
        logout,
        setup,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
