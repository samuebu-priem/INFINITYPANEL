const STORAGE_KEYS = {
  token: "submanager_token",
};

export function getToken() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEYS.token);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(STORAGE_KEYS.token, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.token);
    }
  } catch {
    // Ignore storage failures.
  }
}

export function clearToken() {
  setToken(null);
}

export const storage = {
  getAccessToken: getToken,
  setAccessToken: setToken,
  clearAccessToken: clearToken,
};
