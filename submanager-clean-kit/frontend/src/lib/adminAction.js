import { api } from "../services/api.js";

export async function deactivatePlan(planId) {
  return api.patch(`/plans/${planId}/status`, { isActive: false });
}

export async function activatePlan(planId) {
  return api.patch(`/plans/${planId}/status`, { isActive: true });
}

export async function deletePlan(planId) {
  return api.delete(`/plans/${planId}`);
}

export async function revokeSubscription(subscriptionId) {
  return api.patch(`/subscriptions/${subscriptionId}/revoke`);
}
