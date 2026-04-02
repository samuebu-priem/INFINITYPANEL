import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { activatePlan, deactivatePlan, deletePlan } from "../lib/adminAction.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function parseMetadata(input) {
  if (!input) return undefined;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

export default function Plans() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("plans");
  const [creatorUsers, setCreatorUsers] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    amount: "",
    billingCycle: "MONTHLY",
    currency: "BRL",
    quantity: "",
    durationDays: "",
    metadata: "",
    originalAmount: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlans = async () => {
    try {
      const response = await api.get("/plans");
      const list = Array.isArray(response?.plans) ? response.plans : Array.isArray(response) ? response : [];
      setPlans(
        list.map((plan) => ({
          ...plan,
          metadata: typeof plan.metadata === "string" ? parseMetadata(plan.metadata) : plan.metadata,
        })),
      );
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCreatorUsers = async () => {
    try {
      const response = await api.get("/users");
      const users = Array.isArray(response?.users) ? response.users : [];
      setCreatorUsers(users.filter((item) => item?.role === "ADMIN"));
    } catch {
      setCreatorUsers([]);
    }
  };

  useEffect(() => {
    loadPlans();
    if (isAdmin) loadCreatorUsers();
  }, [isAdmin]);

  const visiblePlans = useMemo(() => plans.filter(Boolean), [plans]);

  const resetForm = () => {
      setForm({
        id: "",
        name: "",
        description: "",
        amount: "",
        billingCycle: "MONTHLY",
        currency: "BRL",
        quantity: "",
        durationDays: "",
        metadata: "",
        originalAmount: "",
      });
  };

  const startCreate = () => {
    resetForm();
    setTab("editor");
  };

  const startEdit = (plan) => {
    const normalizedMetadata = typeof plan.metadata === "object" && plan.metadata ? plan.metadata : {};
    setForm({
      id: plan.id,
      name: plan.name || "",
      description: plan.description || "",
      amount: String(plan.amount ?? ""),
      billingCycle: plan.billingCycle || "MONTHLY",
      currency: plan.currency || "BRL",
      quantity: String(plan.quantity ?? normalizedMetadata.stock ?? ""),
      durationDays: String(
        normalizedMetadata.validityDays ??
          normalizedMetadata.days ??
          normalizedMetadata.durationDays ??
          ""
      ),
      originalAmount: String(
        plan.originalAmount ??
          plan.oldAmount ??
          normalizedMetadata.originalAmount ??
          normalizedMetadata.oldAmount ??
          normalizedMetadata.promotionalPrice ??
          ""
      ),
    });
    setTab("editor");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const parsedOriginalAmount = Number(form.originalAmount);
    const parsedValidityDays = Number(form.durationDays);
    const payload = {
      name: form.name,
      description: form.description || null,
      amount: Number(form.amount || 0),
      billingCycle: form.billingCycle,
      currency: form.currency,
      quantity: Number(form.quantity || 0),
      metadata: {
        ...(Number.isFinite(parsedValidityDays) && parsedValidityDays > 0 ? { validityDays: parsedValidityDays } : {}),
        ...(Number.isFinite(parsedOriginalAmount) && parsedOriginalAmount > 0 ? { originalAmount: parsedOriginalAmount } : {}),
      },
    };

    try {
      if (form.id) {
        await api.patch(`/plans/${form.id}`, payload);
        setMessage("Plano atualizado com sucesso.");
      } else {
        await api.post("/plans", payload);
        setMessage("Plano criado com sucesso.");
      }
      resetForm();
      await loadPlans();
      setTab("plans");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o plano.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    setMessage("");
    try {
      await deletePlan(planId);
      setMessage("Plano excluído com sucesso.");
      await loadPlans();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o plano.");
    }
  };

  const handleToggleStatus = async (planId, isActive) => {
    setMessage("");
    try {
      if (isActive) {
        await deactivatePlan(planId);
        setMessage("Plano desativado com sucesso.");
      } else {
        await activatePlan(planId);
        setMessage("Plano ativado com sucesso.");
      }
      await loadPlans();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar o status do plano.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Planos</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Escolha um plano</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isAdmin
            ? "Admin pode criar, editar, excluir e desativar planos usando a API real."
            : "Player visualiza os planos com o mesmo padrão visual da Home."}
        </p>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("plans")}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              tab === "plans"
                ? "border-sky-500 bg-sky-500/10 text-sky-300"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
            }`}
          >
            Lista de planos
          </button>
          <button
            type="button"
            onClick={startCreate}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              tab === "editor"
                ? "border-sky-500 bg-sky-500/10 text-sky-300"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
            }`}
          >
            Criar / editar
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              tab === "users"
                ? "border-sky-500 bg-sky-500/10 text-sky-300"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
            }`}
          >
            Usuários admin
          </button>
        </div>
      ) : null}

      {isAdmin && tab === "editor" ? (
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">{form.id ? "Editar plano" : "Criar plano"}</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Gerenciar plano</h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700"
            >
              Limpar
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Título</span>
              <input
                type="text"
                className="field"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do plano"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Preço</span>
              <input
                type="number"
                step="0.01"
                className="field"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Preço promocional / original</span>
              <input
                type="number"
                step="0.01"
                className="field"
                value={form.originalAmount}
                onChange={(event) => setForm((current) => ({ ...current, originalAmount: event.target.value }))}
                placeholder="0.00"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Validade em dias</span>
              <input
                type="number"
                className="field"
                value={form.durationDays}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))}
                placeholder="30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Estoque</span>
              <input
                type="number"
                className="field"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Ciclo</span>
              <select
                className="field"
                value={form.billingCycle}
                onChange={(event) => setForm((current) => ({ ...current, billingCycle: event.target.value }))}
              >
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
                <option value="YEARLY">Anual</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Descrição</span>
              <textarea
                className="field min-h-28"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descreva as features do plano"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Moeda</span>
              <input
                type="text"
                className="field"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                placeholder="BRL"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Features / metadata</span>
              <textarea
                className="field min-h-28"
                value={form.metadata}
                onChange={(event) => setForm((current) => ({ ...current, metadata: event.target.value }))}
                placeholder='{"features":["..."]}'
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : form.id ? "Atualizar plano" : "Criar plano"}
            </button>
          </div>
        </form>
      ) : null}

      {isAdmin && tab === "users" ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Usuários que podem criar planos</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Admins do PostgreSQL</h2>
          <div className="mt-5 space-y-3">
            {creatorUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
                Nenhum usuário ADMIN disponível na API atual.
              </div>
            ) : (
              creatorUsers.map((admin) => (
                <div key={admin.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="font-semibold text-white">{admin.email || admin.username || admin.name}</p>
                  <p className="text-sm text-slate-400">role: {admin.role}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-300">Carregando planos...</div>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-300">Nenhum plano disponível.</div>
      ) : (
        <div className="space-y-4">
          {isAdmin ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlans.map((plan) => (
                <div key={plan.id} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{plan.description || "Sem descrição"}</p>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {plan.metadata?.originalAmount ? (
                          <span className="text-slate-500 line-through">{formatCurrency(plan.metadata.originalAmount)}</span>
                        ) : null}
                        <span className="font-semibold text-white">{formatCurrency(plan.amount)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Validade: {plan.metadata?.validityDays ?? plan.days ?? plan.durationDays ?? 0} dias
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Estoque: {plan.quantity ?? plan.metadata?.stock ?? 0}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Criado por: {plan.ownerEmail || plan.creatorEmail || plan.createdByEmail || "não informado pela API"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(plan.id, plan.isActive !== false)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        plan.isActive !== false
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                      }`}
                    >
                      {plan.isActive !== false ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} user={user} />
              ))}
            </div>
          )}
        </div>
      )}

      {message ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
          {message}
        </div>
      ) : null}
    </div>
  );
}
