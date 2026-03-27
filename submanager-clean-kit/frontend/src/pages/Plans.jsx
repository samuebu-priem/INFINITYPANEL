import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/layouts/AppShell";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils";
import PlanCard from "@/components/subscriptions/PlanCard";
import CheckoutModal from "@/components/subscriptions/CheckoutModal";
import { useAuth } from "@/context/auth";
import { deletePlan } from "@/lib/adminAction";

function mapPlan(plan) {
  const amount = Number(plan?.amount ?? plan?.price ?? 0);
  const durationDays = Number(plan?.metadata?.duration_days ?? plan?.duration_days ?? 30);
  const stock = Number.isFinite(Number(plan?.stock ?? 0)) ? Number(plan.stock ?? 0) : 0;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    price: Number.isFinite(amount) ? amount : 0,
    amount: Number.isFinite(amount) ? amount : 0,
    billingCycle: plan.billingCycle ?? plan.billing_cycle ?? "MONTHLY",
    duration_days: Number.isFinite(durationDays) ? durationDays : 30,
    stock,
    isActive: plan.isActive ?? plan.is_active ?? true,
    features: Array.isArray(plan?.metadata?.features) ? plan.metadata.features : [],
    currency: plan.currency ?? "BRL",
    metadata: plan.metadata ?? {},
  };
}

function emptyForm() {
  return {
    id: null,
    name: "",
    description: "",
    amount: "",
    stock: "0",
    billingCycle: "MONTHLY",
    currency: "BRL",
    duration_days: "30",
    isActive: true,
  };
}

export default function Plans() {
  const { user } = useAuth();
  const canManagePlans = user?.role === "ADMIN" || user?.role === "OWNER";
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(emptyForm());
  const [deletingPlanId, setDeletingPlanId] = useState(null);

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

  function openCreatePlan() {
    setEditingPlan(emptyForm());
    setFormOpen(true);
  }

  function openEditPlan(plan) {
    setEditingPlan({
      id: plan.id,
      name: plan.name ?? "",
      description: plan.description ?? "",
      amount: String(plan.amount ?? plan.price ?? ""),
      stock: String(plan.stock ?? 0),
      billingCycle: plan.billingCycle ?? "MONTHLY",
      currency: plan.currency ?? "BRL",
      duration_days: String(plan.duration_days ?? 30),
      isActive: plan.isActive !== false,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPlan(emptyForm());
  }

  async function handleSavePlan(event) {
    event.preventDefault();
    if (!canManagePlans) return;

    const payload = {
      name: editingPlan.name.trim(),
      description: editingPlan.description.trim(),
      amount: Number(editingPlan.amount),
      stock: Math.max(0, Number(editingPlan.stock) || 0),
      billingCycle: editingPlan.billingCycle,
      currency: editingPlan.currency || "BRL",
      metadata: {
        duration_days: Number(editingPlan.duration_days) || 30,
      },
    };

    if (!payload.name || !Number.isFinite(payload.amount)) {
      toast.error("Preencha nome e valor do plano.");
      return;
    }

    setSavingPlan(true);
    try {
      if (editingPlan.id) {
        await api.patch(`/plans/${editingPlan.id}`, payload, { auth: true });
        toast.success("Plano atualizado com sucesso.");
      } else {
        await api.post("/plans", payload, { auth: true });
        toast.success("Plano criado com sucesso.");
      }

      await loadPlans({ silent: true });
      closeForm();
    } catch (error) {
      toast.error(error?.message || "Não foi possível salvar o plano.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleDeletePlan(plan) {
    if (!canManagePlans) return;
    const confirmed = window.confirm(`Deseja excluir o plano "${plan.name}"?`);
    if (!confirmed) return;

    setDeletingPlanId(plan.id);
    try {
      const result = await deletePlan(plan.id);
      if (result?.deactivated) {
        toast.success(result?.message || "Plano desativado com sucesso.");
      } else {
        toast.success("Plano excluído com sucesso.");
      }
      await loadPlans({ silent: true });
    } catch (error) {
      toast.error(error?.message || "Não foi possível excluir o plano.");
    } finally {
      setDeletingPlanId(null);
    }
  }

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
                Visual limpo, hierarquia mais clara e dados atualizados em tempo real.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canManagePlans && (
                <button
                  type="button"
                  onClick={openCreatePlan}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Criar Plano
                </button>
              )}

              <button
                type="button"
                onClick={() => loadPlans({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Atualizando..." : "Atualizar planos"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Carregando planos...</div>
          ) : activePlans.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">Nenhum plano disponível.</div>
          ) : (
            activePlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={index === 1}
                onSelect={setSelectedPlan}
                onEdit={canManagePlans ? openEditPlan : undefined}
                canEdit={canManagePlans}
              />
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

      {formOpen && canManagePlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">
                  {editingPlan.id ? "Editar plano" : "Criar plano"}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {editingPlan.id ? "Atualizar informações do plano" : "Novo plano"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-6 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Nome</label>
                  <input
                    className="field"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do plano"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Descrição</label>
                  <textarea
                    className="field min-h-28"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do plano"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Valor</label>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.amount}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ciclo de cobrança</label>
                  <input
                    className="field"
                    value={editingPlan.billingCycle}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, billingCycle: e.target.value }))}
                    placeholder="MONTHLY"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Dias de duração</label>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    step="1"
                    value={editingPlan.duration_days}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, duration_days: e.target.value }))}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Moeda</label>
                  <input
                    className="field"
                    value={editingPlan.currency}
                    onChange={(e) => setEditingPlan((prev) => ({ ...prev, currency: e.target.value }))}
                    placeholder="BRL"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {editingPlan.id && (
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(editingPlan)}
                    disabled={deletingPlanId === editingPlan.id || savingPlan}
                    className="rounded-2xl border border-rose-900/50 bg-rose-950 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingPlanId === editingPlan.id ? "Excluindo..." : "Excluir"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPlan ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
