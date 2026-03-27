import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/layouts/AppShell";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils";
import PlanCard from "@/components/subscriptions/PlanCard";
import CheckoutModal from "@/components/subscriptions/CheckoutModal";
import { useAuth } from "@/context/auth";

function mapPlan(plan) {
  const amount = Number(plan?.amount ?? plan?.price ?? 0);
  const durationDays = Number(plan?.metadata?.duration_days ?? plan?.duration_days ?? 30);

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    price: Number.isFinite(amount) ? amount : 0,
    amount: Number.isFinite(amount) ? amount : 0,
    billingCycle: plan.billingCycle ?? plan.billing_cycle ?? "MONTHLY",
    duration_days: Number.isFinite(durationDays) ? durationDays : 30,
    isActive: plan.isActive ?? plan.is_active ?? true,
    features: Array.isArray(plan?.metadata?.features) ? plan.metadata.features : [],
    currency: plan.currency ?? "BRL",
    metadata: plan.metadata ?? {},
  };
}

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await api.get("/plans", { auth: true });
      const rows = Array.isArray(data?.plans) ? data.plans.map(mapPlan) : [];
      setPlans(rows);
    } catch (error) {
      if (!silent) {
        setPlans([]);
        toast.error(error?.message || "Não foi possível carregar os planos.");
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activePlans = useMemo(() => plans.filter((plan) => plan.isActive !== false), [plans]);

  async function handleCheckout(method) {
    if (!selectedPlan || !user) return;

    setProcessing(true);
    try {
      const checkout = await api.post(
        "/checkout/create",
        {
          planId: selectedPlan.id,
          paymentMethod: method,
        },
        { auth: true },
      );

      setCheckoutPlan({
        ...selectedPlan,
        checkout,
      });
      toast.success("Checkout criado com sucesso.");
      await loadPlans({ silent: true });
    } catch (error) {
      toast.error(error?.message || "Não foi possível criar o checkout.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Planos</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Escolha o plano ideal</h2>
              <p className="mt-2 text-slate-400">
                Visual limpo, hierarquia mais clara e dados carregados diretamente da API.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadPlans({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Atualizando..." : "Atualizar planos"}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Carregando planos...</div>
          ) : activePlans.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Nenhum plano disponível.</div>
          ) : (
            activePlans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} isPopular={index === 1} onSelect={setSelectedPlan} />
            ))
          )}
        </section>

        {selectedPlan && (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedPlan.name}</h3>
                <p className="mt-1 text-slate-400">{selectedPlan.description}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-lg font-bold text-white">{formatCurrency(selectedPlan.price)}</p>
                <p className="text-sm text-slate-500">a cada {selectedPlan.duration_days} dias</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <CheckoutModal
        open={Boolean(selectedPlan || checkoutPlan)}
        onClose={() => {
          setSelectedPlan(null);
          setCheckoutPlan(null);
        }}
        plan={checkoutPlan ?? selectedPlan}
        onConfirm={handleCheckout}
        isProcessing={processing}
      />
    </AppShell>
  );
}
