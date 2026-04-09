import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { UserHomeFooter } from "../components/layout/UserHomeFooter.jsx";

function getPlansList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.plans)) return response.plans;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function isPlanActive(plan) {
  if (typeof plan?.active === "boolean") return plan.active;
  if (typeof plan?.isActive === "boolean") return plan.isActive;
  if (typeof plan?.enabled === "boolean") return plan.enabled;
  return true;
}

function getSubscriptionObject(response) {
  if (!response) return null;
  if (response.subscription) return response.subscription;
  if (response.data?.subscription) return response.data.subscription;
  if (response.data) return response.data;
  return response;
}

function getSubscriptionEndsAt(subscription) {
  return (
    subscription?.endsAt ||
    subscription?.expiresAt ||
    subscription?.validUntil ||
    subscription?.endDate ||
    null
  );
}

function getPlanName(subscription) {
  return (
    subscription?.plan?.name ||
    subscription?.plan?.title ||
    subscription?.planName ||
    subscription?.plan?.label ||
    "Plano ativo"
  );
}

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/plans");
        setPlans(getPlansList(response).filter(isPlanActive));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscription(getSubscriptionObject(response));
      } catch (error) {
        setSubscription(null);
        setSubscriptionError(error?.response?.data?.message || "");
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadPlans();
    loadSubscription();
  }, []);

  const remainingDays = useMemo(() => {
    const endsAt = getSubscriptionEndsAt(subscription);
    if (!endsAt) return null;

    const endDate = new Date(endsAt);
    if (Number.isNaN(endDate.getTime())) return null;

    const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  }, [subscription]);

  const visiblePlans = useMemo(() => plans.filter(isPlanActive), [plans]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 shadow-lg shadow-black/20 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300">
              SubManager
            </div>
            <div>
              <p className="text-sm text-[#9ca3af]">
                Bem-vindo,{" "}
                <span className="font-semibold text-[#f3f4f6]">
                  {user?.username || user?.name || "usuário"}
                </span>
              </p>
              <h1 className="mt-1 text-3xl font-bold text-[#f3f4f6] sm:text-4xl">
                Painel da assinatura
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[#9ca3af]">
              A página usa apenas os planos retornados por /api/plans e, quando disponível,
              a assinatura de /api/subscriptions/me.
            </p>
          </div>

          {subscription ? (
            <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
              <div className="rounded-2xl border border-[#1f2937] bg-[#0f141c] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[#f3f4f6]">Ativa</p>
              </div>
              <div className="rounded-2xl border border-[#1f2937] bg-[#0f141c] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280]">Plano</p>
                <p className="mt-1 text-sm font-semibold text-[#f3f4f6]">{getPlanName(subscription)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {subscription || subscriptionError || loadingSubscription ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6">
            <p className="text-sm text-[#9ca3af]">Dias restantes</p>
            <div className="mt-3 rounded-2xl border border-[#1f2937] bg-[#0f141c] px-5 py-4">
              <p className="text-4xl font-bold text-[#f3f4f6]">
                {loadingSubscription ? "..." : remainingDays ?? "—"}
              </p>
              <p className="mt-1 text-sm text-[#9ca3af]">
                {loadingSubscription
                  ? "Carregando assinatura..."
                  : remainingDays === null
                  ? "Sem data final disponível."
                  : remainingDays === 1
                  ? "dia"
                  : "dias"}
              </p>
            </div>
            {subscriptionError ? (
              <p className="mt-4 text-sm text-[#9ca3af]">
                {subscriptionError}
              </p>
            ) : (
              <p className="mt-4 text-sm text-[#9ca3af]">
                Baseado na data final retornada pela assinatura.
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6">
            <p className="text-sm text-[#9ca3af]">Seu acesso</p>
            <h2 className="mt-1 text-xl font-semibold text-[#f3f4f6]">Assinatura atual</h2>
            <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0f141c] p-4">
              <p className="text-sm text-[#9ca3af]">
                {subscription ? getPlanName(subscription) : "Nenhuma assinatura ativa"}
              </p>
              <p className="mt-2 text-sm text-[#9ca3af]">
                {subscription
                  ? "Seu acesso está ativo."
                  : "Nenhuma assinatura foi retornada pela API no momento."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#9ca3af]">Planos</p>
            <h2 className="mt-1 text-xl font-semibold text-[#f3f4f6]">Disponíveis para assinatura</h2>
          </div>
        </div>

        {loadingPlans ? (
          <div className="mt-5 rounded-[2rem] border border-[#1f2937] bg-[#0f141c] p-6 text-[#9ca3af]">
            Carregando planos...
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="mt-5 rounded-[2rem] border border-[#1f2937] bg-[#0f141c] p-6 text-[#9ca3af]">
            Nenhum plano disponível.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} user={user} showCheckout />
            ))}
          </div>
        )}
      </div>

      <UserHomeFooter
        discordUrl={import.meta.env.VITE_DISCORD_URL || "#"}
        instagramUrl={import.meta.env.VITE_INSTAGRAM_URL || "#"}
      />
    </div>
  );
}