import { getPayments, getPlans, getSubscriptions, savePayments, savePlans, saveSubscriptions } from "./storage";

export function deletePlan(planId) {
  const plans = getPlans();
  const subscriptions = getSubscriptions();

  const isPlanInUse = subscriptions.some((s) => s.plan_id === planId);

  if (isPlanInUse) {
    const updatedPlans = plans.map((p) =>
      p.id === planId ? { ...p, is_active: false } : p
    );

    savePlans(updatedPlans);
    alert("Esse plano já estava em uso, então foi desativado em vez de excluído.");
    return;
  }

  const updatedPlans = plans.filter((p) => p.id !== planId);
  savePlans(updatedPlans);
  alert("Plano excluído com sucesso.");
}

export function deactivatePlan(planId) {
  const plans = getPlans();

  const updatedPlans = plans.map((p) =>
    p.id === planId ? { ...p, is_active: false } : p
  );

  savePlans(updatedPlans);
  alert("Plano desativado com sucesso.");
}

export function revokeSubscription(subscriptionId) {
  const subscriptions = getSubscriptions();

  const updatedSubscriptions = subscriptions.map((s) =>
    s.id === subscriptionId
      ? {
          ...s,
          status: "revoked",
          end_date: new Date().toISOString(),
        }
      : s
  );

  saveSubscriptions(updatedSubscriptions);
  alert("Assinatura revogada com sucesso.");
}

export function renewSubscription(subscriptionId, durationDays) {
  const subscriptions = getSubscriptions();

  const updatedSubscriptions = subscriptions.map((s) => {
    if (s.id !== subscriptionId) return s;

    const now = new Date();
    const end = new Date(s.end_date);
    const baseDate = end > now ? end : now;

    const newEnd = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return {
      ...s,
      status: "active",
      end_date: newEnd.toISOString(),
    };
  });

  saveSubscriptions(updatedSubscriptions);
  alert("Assinatura renovada com sucesso.");
}

export function deletePayment(paymentId) {
  const payments = getPayments();
  const updated = payments.filter((p) => p.id !== paymentId);
  savePayments(updated);
  alert("Pagamento excluído e removido do gráfico.");
}

export function deleteSubscription(subscriptionId) {
  const subscriptions = getSubscriptions();
  const updated = subscriptions.filter((s) => s.id !== subscriptionId);
  saveSubscriptions(updated);
  alert("Assinatura excluída com sucesso.");
}
