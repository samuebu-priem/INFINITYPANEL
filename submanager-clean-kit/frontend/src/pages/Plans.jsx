import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/auth.jsx";
import { api } from "../services/api.js";
import PlanCard from "../components/subscriptions/PlanCard.jsx";
import CheckoutModal from "../components/subscriptions/CheckoutModal.jsx";

const emptyForm = {
  name: "",
  description: "",
  amount: "",
  billingCycle: "MONTHLY",
  currency: "BRL",
  quantity: "0",
};

function isAdminRole(role) {
  return role === "ADMIN" || role === "OWNER";
}

function mapPlan(raw) {
  const quantity =
    typeof raw?.quantity === "number"
      ? raw.quantity
      : typeof raw?.stock === "number"
        ? raw.stock
        : typeof raw?.availableSlots === "number"
          ? raw.availableSlots
          : typeof raw?.metadata?.stock === "number"
            ? raw.metadata.stock
            : 0;

  return {
    ...raw,
    quantity,
  };
}

export default function Plans() {
  const { user } = useAuth();
  const canManagePlans = isAdminRole(user?.role);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const activePlans = useMemo(() => plans.filter((plan) => plan.isActive !== false), [plans]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get("/plans");
      const nextPlans = Array.isArray(response.data?.plans) ? response.data.plans.map(mapPlan) : [];
      setPlans(nextPlans);
    } catch (error) {
      toast.error("Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      description: plan.description || "",
      amount: String(plan.amount ?? ""),
      billingCycle: plan.billingCycle || "MONTHLY",
      currency: plan.currency || "BRL",
      quantity: String(plan.quantity ?? 0),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: Number(form.amount),
        billingCycle: form.billingCycle,
        currency: form.currency.trim() || "BRL",
        quantity: Number(form.quantity || 0),
      };

      if (editingPlan?.id) {
        const response = await api.patch(`/plans/${editingPlan.id}`, payload);
        const updatedPlan = mapPlan(response.data?.plan);
        setPlans((current) => current.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
        toast.success("Plano atualizado.");
      } else {
        const response = await api.post("/plans", payload);
        const createdPlan = mapPlan(response.data?.plan);
        setPlans((current) => [...current, createdPlan].sort((a, b) => Number(a.amount) - Number(b.amount)));
        toast.success("Plano criado.");
      }

      closeForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível salvar o plano.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Excluir o plano "${plan.name}"?`)) return;
    setDeletingId(plan.id);

    try {
      await api.delete(`/plans/${plan.id}`);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      toast.success("Plano excluído.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível excluir o plano.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">Planos</p>
          <h1 className="mt-1 text-3xl font-bold text-white">InfinityPainel</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadPlans}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-white transition hover:border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          {canManagePlans && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-500"
            >
              <Plus className="h-4 w-4" />
              Criar Plano
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-slate-400">Carregando planos.</div>
      ) : activePlans.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-slate-400">Nenhum plano disponível.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={() => setCheckoutPlan(plan)}
              canManage={canManagePlans}
              onEdit={() => openEdit(plan)}
              onDelete={() => handleDelete(plan)}
              deleting={deletingId === plan.id}
            />
          ))}
        </div>
      )}

      {formOpen && canManagePlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">
                  {editingPlan ? "Editar plano" : "Novo plano"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">{editingPlan ? "Editar plano" : "Criar plano"}</h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-slate-300">Nome</span>
                <input
                  className="field"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome do plano"
                  required
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-slate-300">Descrição</span>
                <textarea
                  className="field min-h-[120px]"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Descrição do plano"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Valor</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Estoque</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Ciclo</span>
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

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Moeda</span>
                <input
                  className="field"
                  value={form.currency}
                  onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                />
              </label>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-white transition hover:border-slate-600 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {editingPlan ? "Salvar" : "Criar plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CheckoutModal open={Boolean(checkoutPlan)} plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
    </div>
  );
}
