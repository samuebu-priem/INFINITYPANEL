import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AppShell from "@/layouts/AppShell";
import RevenueChart from "@/components/admin/RevenueChart";
import StatCard from "@/components/admin/StatCard";
import { api } from "@/services/api";
import { formatCurrency, formatDate } from "@/utils";

function mapPayment(payment) {
  return {
    id: payment.id,
    user_email: payment.user_email ?? payment.userEmail ?? "—",
    plan_name: payment.plan_name ?? payment.planName ?? "Plano",
    payment_method: payment.payment_method ?? payment.paymentMethod ?? "—",
    amount: Number(payment.amount ?? payment.totalAmount ?? 0),
    created_date: payment.created_date ?? payment.createdAt ?? payment.createdAt ?? null,
  };
}

function mapSubscription(subscription) {
  return {
    id: subscription.id,
    status: subscription.status ?? "active",
    startsAt: subscription.startsAt ?? subscription.startDate ?? null,
    endsAt: subscription.endsAt ?? subscription.endDate ?? null,
  };
}

export default function AdminDashboard() {
  const [refresh, setRefresh] = useState(0);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  async function loadDashboard() {
    const [plansData, paymentsData, subscriptionsData] = await Promise.all([
      api.get("/plans", { auth: true }),
      api.get("/payments/me", { auth: true }).catch(() => ({ payments: [] })),
      api.get("/subscriptions/me", { auth: true }).catch(() => ({ subscription: null })),
    ]);

    setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
    setPayments(Array.isArray(paymentsData?.payments) ? paymentsData.payments.map(mapPayment) : []);
    setSubscriptions(subscriptionsData?.subscription ? [mapSubscription(subscriptionsData.subscription)] : []);
  }

  useEffect(() => {
    loadDashboard().catch(() => {
      setPlans([]);
      setPayments([]);
      setSubscriptions([]);
    });
  }, [refresh]);

  const totalRevenue = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments],
  );

  const forceRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Painel administrativo</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Dashboard Admin</h2>
              <p className="mt-2 text-slate-400">Visão geral dos dados com acabamento visual mais consistente.</p>
            </div>
            <button
              type="button"
              onClick={forceRefresh}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Atualizar dados
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Planos" value={plans.length} help="Quantidade total cadastrada" />
          <StatCard label="Assinaturas" value={subscriptions.length} help="Histórico recente" />
          <StatCard label="Pagamentos" value={payments.length} help="Dados recentes" />
          <StatCard label="Receita" value={formatCurrency(totalRevenue)} help="Somatório total" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <RevenueChart payments={payments} />
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-white">Assinantes</h3>
              <Link
                to="/admin/subscribers"
                className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Gerenciar
              </Link>
            </div>
            <p className="mt-2 text-sm text-slate-400">Abra a aba de assinantes para ter controle total.</p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <h3 className="mb-4 text-xl font-semibold text-white">Últimos pagamentos</h3>
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-slate-500">Nenhum pagamento salvo ainda.</p>
              ) : (
                payments
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 p-4"
                    >
                      <div>
                        <p className="font-medium text-white">{payment.user_email}</p>
                        <p className="text-sm text-slate-400">
                          {payment.plan_name} • {payment.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-slate-500">{formatDate(payment.created_date)}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
          <h3 className="mb-4 text-xl font-semibold text-white">Gerenciar planos</h3>
          <div className="space-y-3">
            {plans.length === 0 ? (
              <p className="text-slate-500">Nenhum plano cadastrado.</p>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{plan.name}</p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(Number(plan.amount ?? plan.price ?? 0))} • {plan.billingCycle ?? "MONTHLY"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{plan.isActive ? "Ativo" : "Desativado"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
