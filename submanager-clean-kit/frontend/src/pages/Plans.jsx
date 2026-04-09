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
  if (typeof plan?.available === "boolean") return plan.available;
  return true;
}

function getPlanName(plan) {
  return plan?.name || plan?.title || plan?.label || "Plano sem nome";
}

function getPlanAmount(plan) {
  return plan?.amount ?? plan?.price ?? plan?.value ?? plan?.monthlyPrice ?? 0;
}

function getPlanDuration(plan) {
  return (
    plan?.metadata?.validityDays ??
    plan?.metadata?.days ??
    plan?.days ??
    plan?.durationDays ??
    plan?.duration ??
    null
  );
}

function getPlanStock(plan) {
  return plan?.quantity ?? plan?.metadata?.stock ?? null;
}

export default function Plans() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("plans");
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    amount: "",
    billingCycle: "MONTHLY",
    currency: "BRL",
    quantity: "",
    durationDays: "",
    originalAmount: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlans = async () => {
    try {
      const response = await api.get("/plans");
      const list = getPlansList(response).map((plan) => ({
        ...plan,
        metadata: typeof plan.metadata === "string" ? parseMetadata(plan.metadata) : plan.metadata,
      }));
      setPlans(list);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

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
      originalAmount: "",
    });
  };

  const startCreate = () => {
    resetForm();
    setTab("editor");
  };

  const startEdit = (plan) => {
    const normalizedMetadata =
      typeof plan.metadata === "object" && plan.metadata ? plan.metadata : {};
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

    const payload = {
      name: form.name,
      description: form.description || null,
      amount: Number(form.amount || 0),
      billingCycle: form.billingCycle,
      currency: form.currency,
      quantity: Number(form.quantity || 0),
      metadata: {
        ...(Number(form.durationDays) > 0 ? { validityDays: Number(form.durationDays) } : {}),
        ...(Number(form.originalAmount) > 0 ? { originalAmount: Number(form.originalAmount) } : {}),
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
      setMessage(error?.response?.data?.message || error?.message || "Não foi possível salvar o plano.");
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
      setMessage(error?.response?.data?.message || error?.message || "Não foi possível excluir o plano.");
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
      setMessage(error?.response?.data?.message || error?.message || "Não foi possível alterar o status do plano.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-[#9ca3af]">Planos</p>
        <h1 className="mt-1 text-3xl font-bold text-[#f3f4f6]">Catálogo de planos</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          {isAdmin
            ? "Admin pode criar, editar, excluir e ativar/desativar planos usando a API real."
            : "A lista abaixo mostra apenas os planos retornados pela API /api/plans."}
        </p>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("plans")}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              tab === "plans"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                : "border-[#1f2937] bg-[#121821] text-[#9ca3af] hover:border-[#374151]"
            }`}
          >
            Lista de planos
          </button>
          <button
            type="button"
            onClick={startCreate}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              tab === "editor"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                : "border-[#1f2937] bg-[#121821] text-[#9ca3af] hover:border-[#374151]"
            }`}
          >
            Criar / editar
          </button>
        </div>
      ) : null}

      {isAdmin && tab === "editor" ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#9ca3af]">{form.id ? "Editar plano" : "Criar plano"}</p>
              <h2 className="mt-1 text-xl font-semibold text-[#f3f4f6]">Gerenciar plano</h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-[#1f2937] px-4 py-2 text-sm text-[#e5e7eb] transition hover:border-[#374151]"
            >
              Limpar
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Título</span>
              <input
                type="text"
                className="field"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do plano"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Preço</span>
              <input
                type="number"
                step="0.01"
                className="field"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0,00"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Preço original</span>
              <input
                type="number"
                step="0.01"
                className="field"
                value={form.originalAmount}
                onChange={(event) => setForm((current) => ({ ...current, originalAmount: event.target.value }))}
                placeholder="0,00"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Validade em dias</span>
              <input
                type="number"
                className="field"
                value={form.durationDays}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))}
                placeholder="30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Estoque</span>
              <input
                type="number"
                className="field"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Ciclo</span>
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
              <span className="mb-2 block text-sm text-[#9ca3af]">Descrição</span>
              <textarea
                className="field min-h-28"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descrição do plano"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#9ca3af]">Moeda</span>
              <input
                type="text"
                className="field"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                placeholder="BRL"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : form.id ? "Atualizar plano" : "Criar plano"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 text-[#e5e7eb]">
          Carregando planos...
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 text-[#9ca3af]">
          Nenhum plano disponível.
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#f3f4f6]">{getPlanName(plan)}</p>
                      <p className="mt-1 text-sm text-[#9ca3af]">
                        {plan.description || "Sem descrição"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {plan.metadata?.originalAmount ? (
                          <span className="text-[#6b7280] line-through">
                            {formatCurrency(plan.metadata.originalAmount)}
                          </span>
                        ) : null}
                        <span className="font-semibold text-[#f3f4f6]">
                          {formatCurrency(getPlanAmount(plan))}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#9ca3af]">
                        Validade: {getPlanDuration(plan) ?? 0} dias
                      </p>
                      <p className="mt-2 text-xs text-[#6b7280]">
                        Estoque: {getPlanStock(plan) ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(plan.id, isPlanActive(plan))}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isPlanActive(plan)
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isPlanActive(plan) ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      className="rounded-xl border border-[#374151] bg-[#0f141c] px-3 py-2 text-sm font-semibold text-[#e5e7eb] transition hover:border-[#4b5563]"
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
                <PlanCard key={plan.id} plan={plan} user={user} showCheckout />
              ))}
            </div>
          )}
        </div>
      )}

      {message ? (
        <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-5 text-sm text-[#e5e7eb]">
          {message}
        </div>
      ) : null}
    </div>
  );
}