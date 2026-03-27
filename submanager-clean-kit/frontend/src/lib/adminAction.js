import { api } from "@/services/api";

export async function deletePlan(planId) {
  return api.delete(`/plans/${planId}`, { auth: true });
}

export async function deactivatePlan(planId) {
  return api.patch(`/plans/${planId}/status`, { isActive: false }, { auth: true });
}

export async function revokeSubscription(subscriptionId) {
  return api.patch(`/subscriptions/${subscriptionId}/revoke`, {}, { auth: true });
}

export async function renewSubscription(subscriptionId, durationDays) {
  return api.patch(`/subscriptions/${subscriptionId}/renew`, { durationDays }, { auth: true });
}

export async function deletePayment(paymentId) {
  return api.delete(`/payments/${paymentId}`, { auth: true });
}

export async function deleteSubscription(subscriptionId) {
  return api.delete(`/subscriptions/${subscriptionId}`, { auth: true });
}
