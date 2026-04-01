import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/plans");
        const list = Array.isArray(response?.plans) ? response.plans : Array.isArray(response) ? response : [];
        setPlans(list.filter((plan) => plan?.isActive !== false));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscription(response?.subscription ?? null);
      } catch {
        setSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadPlans();
    loadSubscription();
  }, []);

  const remainingDays = useMemo(() => {
    const endsAt = subscription?.endsAt || subscription?.expiresAt || subscription?.validUntil || subscription?.endDate;
    if (!endsAt) return 0;

    const endDate = new Date(endsAt);
    if (Number.isNaN(endDate.getTime())) return 0;

    const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  }, [subscription]);

  const visiblePlans = useMemo(() => plans.filter((plan) => plan?.isActive !== false), [plans]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Bem-vindo</p>
        <h1 className="mt-1 text-3xl font-bold text-white">{user?.name || "InfinityPainel"}</h1>
        <p className="mt-2 text-sm text-slate-400">Acompanhe sua assinatura e escolha um plano disponível.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Dias restantes</p>
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
            <p className="text-4xl font-bold text-white">{remainingDays}</p>
            <p className="mt-1 text-sm text-slate-400">{remainingDays === 1 ? "dia" : "dias"}</p>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            {loadingSubscription ? "Carregando assinatura..." : "Baseado na data final da sua assinatura."}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Seu acesso</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Assinatura atual</h2>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">
              {subscription ? subscription.plan?.name || subscription.planName || "Plano ativo" : "Nenhuma assinatura ativa"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {subscription ? "Seu acesso está ativo." : "Seu contador ficará em 0 até uma nova assinatura ser confirmada."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Planos</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Disponíveis para assinatura</h2>
          </div>
        </div>

        {loadingPlans ? (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-slate-300">
            Carregando planos...
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-slate-300">
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
    </div>
  );
}
