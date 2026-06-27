import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { clearToken, getToken, setToken } from "./storage-token";

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  is_premium: boolean;
  streak: number;
  total_workouts: number;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogleSession: (session_id: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const signIn = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const r = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: { email, password, name },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const signInWithGoogleSession = async (session_id: string) => {
    const r = await api<{ token: string; user: User }>("/auth/google", {
      method: "POST",
      body: { session_id },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const signOut = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    await clearToken();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, signInWithGoogleSession, refresh: loadMe, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
