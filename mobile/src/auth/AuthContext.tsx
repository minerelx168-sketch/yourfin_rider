import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as api from '../api/client';
import type { User } from '../types';

const TOKEN_KEY = 'yourfin.auth.token';

interface AuthState {
  user: User | null;
  token: string | null;
  /** True while restoring the persisted session on startup. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // On startup, restore the token and validate it via GET /auth/me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          api.setAuthToken(saved);
          try {
            const me = await api.getMe();
            if (!cancelled) {
              setToken(saved);
              setUser(me);
            }
          } catch {
            // Token invalid/expired — clear it.
            api.setAuthToken(null);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await api.login(email, password);
    api.setAuthToken(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    api.setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, initializing, login, logout }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
