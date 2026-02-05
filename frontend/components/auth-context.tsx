"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getMe } from "../lib/api";
import type { User } from "../lib/types";

type AuthContextShape = {
  token: string | null;
  user: User | null;
  loading: boolean;
  setSession: (accessToken: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("onepay_token");
    const storedUser = window.localStorage.getItem("onepay_user");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    setToken(storedToken);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    getMe(storedToken)
      .then((profile) => {
        setUser(profile);
        window.localStorage.setItem("onepay_user", JSON.stringify(profile));
      })
      .catch(() => {
        window.localStorage.removeItem("onepay_token");
        window.localStorage.removeItem("onepay_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextShape>(
    () => ({
      token,
      user,
      loading,
      setSession: (accessToken, currentUser) => {
        setToken(accessToken);
        setUser(currentUser);
        window.localStorage.setItem("onepay_token", accessToken);
        window.localStorage.setItem("onepay_user", JSON.stringify(currentUser));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        window.localStorage.removeItem("onepay_token");
        window.localStorage.removeItem("onepay_user");
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextShape {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
