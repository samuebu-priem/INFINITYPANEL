import { api } from "@/services/api";

export async function deletePlan(planId) {
  return api.delete(`/api/plans/${planId}`, { auth: true });
}

export async function deactivatePlan(planId) {
  return api.patch(`/api/plans/${planId}/status`, { isActive: false }, { auth: true });
}

export async function revokeSubscription(subscriptionId) {
  return api.patch(`/api/subscriptions/${subscriptionId}/revoke`, {}, { auth: true });
}

export async function renewSubscription(subscriptionId, durationDays) {
  return api.patch(`/api/subscriptions/${subscriptionId}/renew`, { durationDays }, { auth: true });
}

export async function deletePayment(paymentId) {
  return api.delete(`/api/payments/${paymentId}`, { auth: true });
}

export async function deleteSubscription(subscriptionId) {
  return api.delete(`/api/subscriptions/${subscriptionId}`, { auth: true });
}