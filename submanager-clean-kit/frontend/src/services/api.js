import { storage } from "../lib/storage";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

// Se o caller já passar "/api/..." não duplicar.
// Ex.: api.get("/api/plans") continua funcionando, e api.get("/plans") também.
function withApiPrefix(path) {
  if (!path) return "/api";
  return path.startsWith("/api") ? path : `/api${path.startsWith("/") ? "" : "/"}${path}`;
}

async function parseError(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      const data = await res.json();

      // Backend standard error middleware returns:
      // { error: { message: string, code: string, details?: ... } }
      const msg =
        data?.message ||
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null);

      return msg || "Erro na API";
    } catch {
      return "Erro na API";
    }
  }

  try {
    return (await res.text()) || "Erro na API";
  } catch {
    return "Erro na API";
  }
}

export const api = {
  async get(path, { auth = true } = {}) {
    const token = auth ? storage.getAccessToken() : null;

    const res = await fetch(`${API_URL}${withApiPrefix(path)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async post(path, body, { auth = true } = {}) {
    const token = auth ? storage.getAccessToken() : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${withApiPrefix(path)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async patch(path, body, { auth = true } = {}) {
    const token = auth ? storage.getAccessToken() : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${withApiPrefix(path)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  async delete(path, { auth = true } = {}) {
    const token = auth ? storage.getAccessToken() : null;

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${withApiPrefix(path)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) throw new Error(await parseError(res));

    // Some endpoints may return 204 No Content or an empty body on success.
    if (res.status === 204) return null;

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;

    try {
      return await res.json();
    } catch {
      return null;
    }
  },
};
