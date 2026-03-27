import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { clearToken, getToken, setToken } from "../lib/storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    const response = await api.get("/auth/me");
    setUser(response?.user ?? null);
    return response?.user ?? null;
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function login({ emailOrUsername, password }) {
    const response = await api.post("/auth/login", { emailOrUsername, password }, { auth: false });

    if (response?.accessToken) setToken(response.accessToken);
    setUser(response?.user ?? null);

    return response;
  }

  async function register({ email, username, password, role, nickname, acceptPrivacyTerms, acceptFinancialTerms }) {
    const response = await api.post(
      "/auth/register",
      { email, username, password, role, nickname, acceptPrivacyTerms, acceptFinancialTerms },
      { auth: false },
    );

    if (response?.accessToken) setToken(response.accessToken);
    setUser(response?.user ?? null);

    return response;
  }

  function logout() {
    clearToken();
    setUser(null);
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
