import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deletePayment, deletePlan, deactivatePlan } from "@/lib/adminAction";
import AppShell from "@/layouts/AppShell";
import RevenueChart from "@/components/admin/RevenueChart";
import StatCard from "@/components/admin/StatCard";
import { getPayments, getPlans, getSubscriptions } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/utils";

export default function AdminDashboard() {
  const [refresh, setRefresh] = useState(0);

  const plans = getPlans();
  const payments = getPayments();
  const subscriptions = getSubscriptions();

  const totalRevenue = useMemo(() => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [payments, refresh]);

  const forceRefresh = () => setRefresh((prev) => prev + 1);

  function handleDeletePayment(paymentId) {
    const ok = window.confirm("Excluir este pagamento? Ele será removido do gráfico e do histórico local.");
    if (!ok) return;
    deletePayment(paymentId);
    forceRefresh();
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <section>
          <h2 className="text-3xl font-bold">Dashboard Admin</h2>
          <p className="text-slate-400 mt-2">Visão geral dos dados locais do projeto limpo.</p>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Planos" value={plans.length} help="Quantidade total cadastrada" />
          <StatCard label="Assinaturas" value={subscriptions.length} help="Histórico salvo localmente" />
          <StatCard label="Pagamentos" value={payments.length} help="Checkout ainda simulado" />
          <StatCard label="Receita" value={formatCurrency(totalRevenue)} help="Somatório local" />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart payments={payments} onDeletePayment={handleDeletePayment} />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">Assinantes</h3>
              <Link
                to="/admin/subscribers"
                className="rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 px-3 py-2 text-sm font-semibold"
              >
                Gerenciar
              </Link>
            </div>
            <p className="text-slate-400 text-sm mt-2">Abra a aba de assinantes para ter controle total.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold mb-4">Últimos pagamentos</h3>
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
                      className="rounded-2xl border border-slate-800 p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">{payment.user_email}</p>
                        <p className="text-sm text-slate-400">
                          {payment.plan_name} • {payment.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-slate-500">{formatDate(payment.created_date)}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold mb-4">Gerenciar planos</h3>
          <div className="space-y-3">
            {plans.length === 0 ? (
              <p className="text-slate-500">Nenhum plano cadastrado.</p>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-800 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(plan.price)} • {plan.duration_days} dias
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {plan.is_active ? "Ativo" : "Desativado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
  <button
    onClick={() => {
      deactivatePlan(plan.id);
      window.location.reload();
    }}
    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded-lg text-sm text-black font-medium"
  >
    Desativar
  </button>

  <button
    onClick={() => {
      deletePlan(plan.id);
      window.location.reload();
    }}
    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm"
  >
    Excluir
  </button>
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
