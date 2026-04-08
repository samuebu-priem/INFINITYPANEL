import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { deletePayment, updatePayment, deactivatePlan, revokeSubscription } from "../lib/adminAction.js";
import RevenueChart from "../components/admin/RevenueChart.jsx";
import StatCard from "../components/admin/StatCard.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export default function AdminDashboard() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, usersRes, subscriptionsRes, paymentsRes] = await Promise.allSettled([
        api.get("/plans"),
        api.get("/users"),
        api.get("/subscriptions/me"),
        api.get("/payments"),
      ]);

      const plansList = plansRes.status === "fulfilled"
        ? Array.isArray(plansRes.value?.plans)
          ? plansRes.value.plans
          : Array.isArray(plansRes.value)
            ? plansRes.value
            : []
        : [];

      const userList = usersRes.status === "fulfilled" ? usersRes.value?.users || [] : [];
      const subscriptionList =
        subscriptionsRes.status === "fulfilled"
          ? subscriptionsRes.value?.subscription
            ? [subscriptionsRes.value.subscription]
            : []
          : [];
      const paymentList = paymentsRes.status === "fulfilled" ? paymentsRes.value?.payments || [] : [];

      setPlans(plansList);
      setSubscriptions(subscriptionList.length > 0 ? subscriptionList : userList);
      setPayments(paymentList);
    } catch {
      setPlans([]);
      setSubscriptions([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activePlans = useMemo(() => plans.filter((plan) => plan?.isActive !== false), [plans]);

  const totalRevenue = useMemo(() => 0, []);

  const searchableSubscribers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscriptions;

    return subscriptions.filter((item) => {
      const haystack = [
        item?.name,
        item?.email,
        item?.username,
        item?.nickname,
        item?.discordNick,
        item?.discordNickname,
        item?.planName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, subscriptions]);

  const revenuePoints = useMemo(() => [], []);

  const handleRevoke = async (subscriptionId) => {
    setActionMessage("");
    try {
      await revokeSubscription(subscriptionId);
      setActionMessage("Assinatura revogada com sucesso.");
      await loadData();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Não foi possível revogar a assinatura.");
    }
  };

  const handleDisablePlan = async (planId) => {
    setActionMessage("");
    try {
      await deactivatePlan(planId);
      setActionMessage("Plano desativado com sucesso.");
      await loadData();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Não foi possível desativar o plano.");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setActionMessage("");
    try {
      await deletePayment(paymentId);
      setPayments((current) => current.filter((payment) => payment.id !== paymentId));
      setActionMessage("Receita excluída com sucesso.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Não foi possível excluir a receita.");
    }
  };

  const handleEditPayment = async (payment) => {
    setActionMessage("");
    try {
      const nextAmount = Number(window.prompt("Novo valor da receita:", String(payment?.amount ?? 0)));
      if (Number.isNaN(nextAmount)) return;

      const payload = {
        amount: nextAmount,
      };

      await updatePayment(payment.id, payload);
      setPayments((current) =>
        current.map((item) => (item.id === payment.id ? { ...item, amount: nextAmount } : item)),
      );
      setActionMessage("Receita atualizada com sucesso.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Não foi possível editar a receita.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Painel administrativo</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Visão geral</h1>
        <p className="mt-2 text-sm text-slate-400">
          Dados consolidados de planos, assinaturas e pagamentos usando a API real disponível.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de planos" value={loading ? "..." : plans.length} help="Planos cadastrados no backend" />
        <StatCard label="Planos ativos" value={loading ? "..." : activePlans.length} help="Planos visíveis para assinatura" />
        <StatCard label="Assinaturas" value={loading ? "..." : subscriptions.length} help="Total de assinaturas recuperadas" />
        <StatCard label="Lucro / pagamentos" value={loading ? "..." : formatCurrency(totalRevenue)} help="Somatório dos pagamentos retornados" />
      </div>

      <RevenueChart payments={[]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Planos ativos</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Gerenciamento rápido</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activePlans.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">Nenhum plano ativo.</div>
            ) : (
              activePlans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{plan.name}</p>
                      <p className="text-sm text-slate-400">{plan.description || "Sem descrição"}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatCurrency(plan.amount)}
                        {plan.metadata?.originalAmount ? (
                          <span className="ml-2 text-slate-500 line-through">{formatCurrency(plan.metadata.originalAmount)}</span>
                        ) : null}
                        <span className="ml-2">• validade {plan.quantity ?? 0} dias</span>
                        <span className="ml-2">• estoque {plan.quantity ?? 0}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDisablePlan(plan.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Desativar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Últimos assinantes</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pesquisa e ações</h2>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm text-slate-300">Buscar assinante</span>
            <input
              type="text"
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, email, username ou nick"
            />
          </label>

          <div className="mt-5 space-y-3">
            {searchableSubscribers.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">Nenhuma assinatura ativa encontrada.</div>
            ) : (
              searchableSubscribers.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.name || item.email || item.username || "Assinante"}</p>
                      <p className="text-sm text-slate-400">
                        {item.email || item.username || item.nickname || item.discordNick || item.discordNickname || "Sem email disponível"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.planName || item.plan?.name || "Plano não informado"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(item.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Revogar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Receitas</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Controle manual</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">Nenhuma receita encontrada.</div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-slate-400">
                      {payment.status || "status não informado"} • {payment.createdAt ? new Date(payment.createdAt).toLocaleString("pt-BR") : "data não informada"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditPayment(payment)}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {actionMessage ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
          {actionMessage}
        </div>
      ) : null}
    </div>
  );
}
