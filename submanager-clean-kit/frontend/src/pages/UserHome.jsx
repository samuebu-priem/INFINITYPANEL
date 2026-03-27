import { useEffect, useMemo, useState } from "react";
import { Loader2, Shield, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import AppShell from "@/layouts/AppShell";
import CheckoutModal from "@/components/subscriptions/CheckoutModal";
import DiscordLink from "@/components/profile/DiscordLink";
import PlanCard from "@/components/subscriptions/PlanCard";
import SubscriptionStatus from "@/components/subscriptions/SubscriptionStatus";
import { useAuth } from "@/context/auth";
import { api } from "@/services/api";

function mapPlan(plan) {
  const amount = Number(plan?.amount ?? plan?.price ?? 0);
  const features = Array.isArray(plan?.metadata?.features)
    ? plan.metadata.features
    : Array.isArray(plan?.features)
      ? plan.features
      : [];

  const durationDays = Number(
    plan?.metadata?.duration_days ?? plan?.metadata?.durationDays ?? plan?.duration_days ?? 30,
  );

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    price: Number.isFinite(amount) ? amount : 0,
    amount: Number.isFinite(amount) ? amount : 0,
    billingCycle: plan.billingCycle ?? plan.billing_cycle ?? "MONTHLY",
    duration_days: Number.isFinite(durationDays) ? durationDays : 30,
    isActive: plan.isActive ?? plan.is_active ?? true,
    features,
    currency: plan.currency ?? "BRL",
    metadata: plan.metadata ?? {},
  };
}

function mapSubscription(subscription) {
  if (!subscription) return null;

  return {
    id: subscription.id,
    plan_name: subscription.plan?.name ?? subscription.plan_name ?? "Plano",
    amount_paid: subscription.amountPaid ?? subscription.amount_paid ?? subscription.plan?.amount ?? 0,
    start_date: subscription.startsAt ?? subscription.startDate ?? subscription.createdAt ?? null,
    end_date: subscription.endsAt ?? subscription.endDate ?? null,
    payment_status: subscription.status ?? subscription.payment_status ?? "active",
    status: subscription.status ?? "active",
  };
}

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [plansData, subscriptionData] = await Promise.all([
          api.get("/api/plans", { auth: true }),
          api.get("/api/subscriptions/me", { auth: true }).catch(() => ({ subscription: null })),
        ]);

        if (!alive) return;

        const apiPlans = Array.isArray(plansData?.plans) ? plansData.plans : [];
        setPlans(apiPlans.filter((plan) => plan?.isActive !== false).map(mapPlan));
        setSubscription(mapSubscription(subscriptionData?.subscription));
      } catch (error) {
        if (alive) {
          setPlans([]);
          setSubscription(null);
          toast.error(error?.message || "Não foi possível carregar os dados.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (user?.role) load();

    return () => {
      alive = false;
    };
  }, [user?.role]);

  const highlights = [
    { icon: Zap, label: "Ativação imediata" },
    { icon: Shield, label: "Suporte 24/7" },
    { icon: Star, label: "Controle seus lucros" },
  ];

  const activeSubscription = useMemo(() => subscription, [subscription]);

  const handleCheckout = async (paymentMethod) => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);
    try {
      const checkout = await api.post(
        "/api/checkout/create",
        {
          planId: selectedPlan.id,
          paymentMethod,
        },
        { auth: true },
      );

      setSelectedPlan((current) => ({
        ...(current ?? selectedPlan),
        checkout,
      }));

      toast.success("Checkout criado. Aguardando confirmação do pagamento.");
    } catch (error) {
      toast.error(error?.message || "Não foi possível iniciar o checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-900/20 via-slate-950 to-blue-900/10" />
        <div className="relative mx-auto max-w-5xl px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-2 text-sm font-medium text-sky-400">
              Bem-vindo, {user.username?.split(" ")[0] || "usuário"}
            </p>
            <h1 className="mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
              Acesso Premium
            </h1>
            <p className="font-semibold tracking-wide text-slate-200">A MELHOR ORG DO CENÁRIO</p>
          </motion.div>

          <motion.div className="mt-8 flex flex-wrap gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                  <item.icon className="h-4 w-4 text-sky-400" />
                </div>
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">Sua Assinatura</h2>
          <SubscriptionStatus subscription={activeSubscription} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">Conta Discord</h2>
          <DiscordLink />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">Planos Disponíveis</h2>
          <p className="text-sm text-slate-500">Escolha o plano ideal para você</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} isPopular={index === 1} onSelect={setSelectedPlan} />
            ))}
          </div>
        </section>
      </div>

      <CheckoutModal
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        onConfirm={handleCheckout}
        isProcessing={isProcessing}
      />
    </AppShell>
  );
}
