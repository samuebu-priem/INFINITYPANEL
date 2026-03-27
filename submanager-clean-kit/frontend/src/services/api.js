import { getToken } from "../lib/storage";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

function normalizePath(path) {
  if (!path) return "/";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(path) {
  const normalizedPath = normalizePath(path);
  if (!API_URL) return normalizedPath;
  return `${API_URL}${normalizedPath}`;
}

async function parseError(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    try {
      const data = await res.json();
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

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  const token = auth ? getToken() : null;

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body ?? {}) : undefined,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  get(path, { auth = true } = {}) {
    return request(path, { method: "GET", auth });
  },

  post(path, body, { auth = true } = {}) {
    return request(path, { method: "POST", body, auth });
  },

  patch(path, body, { auth = true } = {}) {
    return request(path, { method: "PATCH", body, auth });
  },

  delete(path, { auth = true } = {}) {
    return request(path, { method: "DELETE", auth });
  },
};
