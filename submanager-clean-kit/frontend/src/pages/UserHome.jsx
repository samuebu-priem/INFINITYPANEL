import { useEffect, useMemo, useState } from "react";
import { Loader2, Shield, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppShell from "@/layouts/AppShell";
import SubscriptionStatus from "@/components/subscriptions/SubscriptionStatus";
import PlanCard from "@/components/subscriptions/PlanCard";
import CheckoutModal from "@/components/subscriptions/CheckoutModal";
import DiscordLink from "@/components/profile/DiscordLink";
import { api } from "@/services/api";
import { useAuth } from "@/context/auth";
import { getConfigs, getPayments, getPlans, getSubscriptions, savePayments, saveSubscriptions } from "@/lib/storage";

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // Prefer backend plans (real checkout requires backend IDs)
        const data = await api.get("/api/plans", { auth: true });
        const apiPlans = Array.isArray(data?.plans) ? data.plans : [];

        if (alive && apiPlans.length) {
          setPlans(
            apiPlans
              .filter((p) => p.isActive !== false)
              .map((p) => ({
                // Keep local-shape fields expected by PlanCard/CheckoutModal
                id: p.id,
                backendId: p.id,
                name: p.name,
                description: p.description,
                price: Number(p.amount),
                currency: p.currency,
                billingCycle: p.billingCycle,
                // PlanCard expects duration_days
                duration_days:
                  typeof p?.metadata?.duration_days === "number"
                    ? p.metadata.duration_days
                    : typeof p?.metadata?.duration_days === "string"
                      ? Number(p.metadata.duration_days)
                      : 30,
                is_active: p.isActive,
                // PlanCard expects `features` array
                features: Array.isArray(p?.metadata?.features)
                  ? p.metadata.features
                  : Array.isArray(p.features)
                    ? p.features
                    : [],
              })),
          );
        } else if (alive) {
          // fallback to local plans
          setPlans(getPlans().filter((plan) => plan.is_active !== false));
        }
      } catch {
        if (alive) setPlans(getPlans().filter((plan) => plan.is_active !== false));
      } finally {
        if (!alive) return;
        setConfigs(getConfigs());
        setSubscriptions(getSubscriptions().filter((sub) => sub.user_email === user?.email));
        setLoading(false);
      }
    }

    if (user?.email) load();

    return () => {
      alive = false;
    };
  }, [user?.email]);

  const getConfig = (key, fallback) => configs.find((item) => item.key === key)?.value || fallback;
  const activeSubscription = useMemo(() => subscriptions.find((item) => item.status === "active"), [subscriptions]);

  const handleCheckout = async (paymentMethod) => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);
    try {
      // Real backend call. No client-side approval.
      const planId = selectedPlan.backendId ?? selectedPlan.id;

      const checkout = await api.post("/api/checkout/create", { planId }, { auth: true });

      // Keep local demo storage in sync but do NOT mark as paid/active automatically.
      const now = new Date();
      const payment = {
        id: checkout.paymentTransactionId || crypto.randomUUID(),
        user_email: user.email,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price,
        status: checkout.status,
        payment_method: paymentMethod,
        created_date: now.toISOString(),
        checkoutSessionId: checkout.checkoutSessionId,
      };

      savePayments([...getPayments(), payment]);

      setSelectedPlan({
        ...selectedPlan,
        checkout,
      });

      toast.message("Checkout criado. Aguardando pagamento.");
    } catch (err) {
      toast.error(err?.message || "Não foi possível iniciar o checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const highlights = [
    { icon: Zap, label: "Ativação imediata" },
    { icon: Shield, label: "Suporte 24/7" },
    { icon: Star, label: "Controle seus lucros" },
  ];

  return (
    <AppShell>
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-slate-950 to-blue-900/10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sky-400 text-sm font-medium mb-2">
              Bem-vindo, {user.username?.split(" ")[0] || "usuário"}
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {getConfig("hero_title", "Acesso Premium")}
            </h1>
            <p className="text-slate-200 font-semibold tracking-wide">
              A MELHOR ORG DO CENÁRIO
            </p>
          </motion.div>
          <motion.div className="flex flex-wrap gap-6 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-sky-400" />
                </div>
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Sua Assinatura</h2>
          <SubscriptionStatus subscription={activeSubscription} />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Conta Discord</h2>
          <DiscordLink />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Planos Disponíveis</h2>
          <p className="text-sm text-slate-500 mb-6">Escolha o plano ideal para você</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
