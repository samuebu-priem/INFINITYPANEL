import { defaultConfigs, defaultPlans, defaultUsers } from "./mock";

const KEYS = {
  users: "submanager_users",
  user: "submanager_current_user",
  plans: "submanager_plans",
  subscriptions: "submanager_subscriptions",
  payments: "submanager_payments",
  configs: "submanager_configs",

  // Backend auth
  accessToken: "submanager_access_token",
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function seedStorage() {
  if (!localStorage.getItem(KEYS.users)) writeJson(KEYS.users, defaultUsers);
  if (!localStorage.getItem(KEYS.plans)) writeJson(KEYS.plans, defaultPlans);
  if (!localStorage.getItem(KEYS.subscriptions)) writeJson(KEYS.subscriptions, []);
  if (!localStorage.getItem(KEYS.payments)) writeJson(KEYS.payments, []);
  if (!localStorage.getItem(KEYS.configs)) writeJson(KEYS.configs, defaultConfigs);

  // Keep config defaults in sync between releases (localStorage may contain older copy).
  // Only updates known keys; preserves any custom admin edits for other keys.
  try {
    const current = readJson(KEYS.configs, defaultConfigs) || [];
    const byKey = new Map(current.map((item) => [item.key, item.value]));
    const merged = defaultConfigs.map((item) => ({
      ...item,
      value: byKey.has(item.key) ? byKey.get(item.key) : item.value,
    }));

    // If any default value changed and local storage still has the old one, update it.
    // Since we can't reliably know "old vs custom", we only enforce the new hero copy.
    const forceKeys = new Set(["hero_title", "hero_subtitle"]);
    const next = merged.map((item) =>
      forceKeys.has(item.key) ? { ...item, value: defaultConfigs.find((d) => d.key === item.key)?.value } : item,
    );

    writeJson(KEYS.configs, next);
  } catch {
    // no-op
  }
}

export function getUsers() {
  seedStorage();
  return readJson(KEYS.users, defaultUsers);
}

export function getCurrentUser() {
  seedStorage();
  return readJson(KEYS.user, null);
}

export function setCurrentUser(user) {
  writeJson(KEYS.user, user);
}

export function getAccessToken() {
  return localStorage.getItem(KEYS.accessToken);
}

export function setAccessToken(accessToken) {
  if (!accessToken) return;
  localStorage.setItem(KEYS.accessToken, accessToken);
}

export function clearAccessToken() {
  localStorage.removeItem(KEYS.accessToken);
}

export function logout() {
  localStorage.removeItem(KEYS.user);
  clearAccessToken();
}

export function getPlans() {
  seedStorage();
  return readJson(KEYS.plans, defaultPlans);
}

export function savePlans(plans) {
  writeJson(KEYS.plans, plans);
}

export function getConfigs() {
  seedStorage();
  return readJson(KEYS.configs, defaultConfigs);
}

export function getPayments() {
  seedStorage();
  return readJson(KEYS.payments, []);
}

export function savePayments(payments) {
  writeJson(KEYS.payments, payments);
}

export function getSubscriptions() {
  seedStorage();
  return readJson(KEYS.subscriptions, []);
}

export function saveSubscriptions(subscriptions) {
  writeJson(KEYS.subscriptions, subscriptions);
}

export function authenticate(email, password) {
  const users = getUsers();
  const user = users.find((item) => item.email === email && item.password === password);
  return user || null;
}

// Backwards-compatible namespace used by the new API wrapper
export const storage = {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
};
