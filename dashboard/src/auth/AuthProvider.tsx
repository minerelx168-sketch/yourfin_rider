import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/client';
import type { User } from '../types';
import { getToken, setToken as persistToken } from './tokenStore';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [initializing, setInitializing] = useState<boolean>(!!getToken());

  // Restore the session on first load if a token is persisted.
  useEffect(() => {
    let cancelled = false;
    const existing = getToken();
    if (!existing) {
      // One-time bootstrap: nothing to restore, so leave the initializing state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitializing(false);
      return;
    }
    api
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // Token invalid/expired — clear it.
        if (!cancelled) {
          persistToken(null);
          setTokenState(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    persistToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, initializing, login, logout }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
