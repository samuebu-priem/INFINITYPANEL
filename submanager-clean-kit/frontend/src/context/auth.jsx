import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/services/api";
import { clearAccessToken, getAccessToken, logout as storageLogout, setAccessToken } from "@/lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function refreshMe() {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    const data = await api.get("/api/auth/me", { auth: true });
    setUser(data.user);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function login({ emailOrUsername, password }) {
    const data = await api.post("/api/auth/login", { emailOrUsername, password }, { auth: false });

    if (data?.accessToken) setAccessToken(data.accessToken);
    setUser(data?.user ?? null);

    return data;
  }

  async function register({ email, username, password, role, nickname }) {
    const data = await api.post(
      "/api/auth/register",
      { email, username, password, role, nickname },
      { auth: false },
    );

    if (data?.accessToken) setAccessToken(data.accessToken);
    setUser(data?.user ?? null);

    return data;
  }

  function logout() {
    storageLogout(); // removes persisted accessToken + current_user from storage
    setUser(null); // clears in-memory authenticated user
  }

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
