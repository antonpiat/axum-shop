"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "@/lib/api";
import type { LoginInput, RegisterInput, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
      } else if (!(error instanceof ApiError)) {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      await apiLogin(input);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await apiRegister(input);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "Admin",
      login,
      logout,
      register,
      refresh,
    }),
    [user, loading, login, logout, register, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
