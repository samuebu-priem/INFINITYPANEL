import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import AppShell from "@/layouts/AppShell";
import { useAuth } from "@/context/auth";
import CheckoutModal from "@/components/subscriptions/CheckoutModal";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils";

const emptyPlan = {
  name: "",
  price: "",
  duration_days: 30,
  description: "",
  features: "",
};

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyPlan);
  const [loadingById, setLoadingById] = useState({});
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    amount: "",
    billingCycle: "",
    description: "",
  });

  const canEdit = useMemo(() => ["ADMIN", "OWNER"].includes(user?.role), [user?.role]);
  const canSubscribe = useMemo(() => ["ADMIN", "OWNER", "PLAYER"].includes(user?.role), [user?.role]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);
  const pollRef = useRef(null);

  async function refreshPlans() {
    try {
      const data = await api.get("/api/plans", { auth: true });
      const apiPlans = data?.plans ?? [];
      if (Array.isArray(apiPlans) && apiPlans.length > 0) {
        setPlans(apiPlans);
        return;
      }
    } catch {
      // fallback to local storage seed
    }

    // Fallback: show seeded/local plans (clean-kit mode)
    const { getPlans } = await import("@/lib/storage");
    const localPlans = getPlans();
    setPlans(
      (localPlans || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        amount: p.price,
        currency: "BRL",
        billingCycle: `${p.duration_days} dias`,
        isActive: Boolean(p.is_active),
        __local: true,
      })),
    );
  }

  useEffect(() => {
    refreshPlans().catch((err) => toast.error(err.message || "Erro ao carregar planos"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCheckout(plan) {
    if (!canSubscribe) return;
    setSelectedPlan({ ...plan, checkout: null });
    setCheckoutSessionId(null);
    setCheckoutOpen(true);
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setCheckoutLoading(false);
    setCheckoutSessionId(null);
    setSelectedPlan(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function createCheckout(plan) {
    if (!plan || plan.__local) {
      toast.message("Checkout indisponível para planos locais.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await api.post("/api/checkout/create", { planId: plan.id }, { auth: true });

      setCheckoutSessionId(result?.checkoutSessionId ?? null);
      setSelectedPlan((prev) => ({
        ...(prev ?? plan),
        checkout: {
          checkoutSessionId: result?.checkoutSessionId,
          status: result?.status,
          checkoutUrl: result?.checkoutUrl ?? null,
          qrCode: result?.qrCode ?? null,
          qrCodeBase64: result?.qrCodeBase64 ?? null,
          expiresAt: result?.expiresAt ?? null,
        },
      }));
    } catch (err) {
      const msg = err?.message || "Erro ao iniciar checkout";
      if (String(msg).toLowerCase().includes("forbidden") || String(msg).includes("403")) {
        toast.error("Apenas ADMIN/OWNER pode iniciar checkout. Faça login com uma conta admin.");
      } else {
        toast.error(msg);
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Poll checkout status while modal is open
  useEffect(() => {
    if (!checkoutOpen || !checkoutSessionId) return;

    async function pollOnce() {
      try {
        const data = await api.get(`/api/checkout/${checkoutSessionId}`, { auth: true });
        const status = data?.status;

        setSelectedPlan((prev) => ({
          ...(prev ?? {}),
          checkout: {
            ...(prev?.checkout ?? {}),
            status,
            checkoutUrl: data?.checkoutUrl ?? prev?.checkout?.checkoutUrl ?? null,
            qrCode: data?.qrCode ?? prev?.checkout?.qrCode ?? null,
            qrCodeBase64: data?.qrCodeBase64 ?? prev?.checkout?.qrCodeBase64 ?? null,
            expiresAt: data?.expiresAt ?? prev?.checkout?.expiresAt ?? null,
          },
        }));

        if (status === "COMPLETED") {
          toast.success("Pagamento confirmado. Assinatura ativada.");
          return true;
        }

        if (status === "CANCELLED" || status === "EXPIRED") {
          toast.error(`Checkout finalizado: ${status}`);
          return true;
        }

        return false;
      } catch {
        return false;
      }
    }

    pollOnce();
    pollRef.current = setInterval(async () => {
      const done = await pollOnce();
      if (done && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 4000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [checkoutOpen, checkoutSessionId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit) return;

    // Prefer backend when available; fallback to local storage for clean-kit mode/offline.
    try {
      await api.post(
        "/api/plans",
        {
          name: form.name,
          description: form.description,
          amount: Number(form.price),
          billingCycle: "MONTHLY",
          currency: "BRL",
          metadata: {
            duration_days: Number(form.duration_days),
            features: form.features
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          },
        },
        { auth: true },
      );

      setForm(emptyPlan);
      await refreshPlans();
      toast.success("Plano criado com sucesso.");
      return;
    } catch {
      // fallback to local
    }

    const { getPlans, savePlans } = await import("@/lib/storage");
    const current = getPlans();

    const newPlan = {
      id: crypto.randomUUID(),
      name: form.name,
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      description: form.description,
      is_active: true,
      features: form.features
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    savePlans([...(current || []), newPlan]);
    setForm(emptyPlan);
    await refreshPlans();
    toast.success("Plano criado com sucesso (local).");
  };

  async function togglePlan(plan) {
    if (!canEdit) return;

    setLoadingById((prev) => ({ ...prev, [plan.id]: true }));
    try {
      if (plan.__local) {
        const { getPlans, savePlans } = await import("@/lib/storage");
        const current = getPlans();
        const updated = (current || []).map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
        savePlans(updated);
        await refreshPlans();
        toast.success("Status do plano atualizado (local).");
        return;
      }

      await api.patch(`/api/plans/${plan.id}/status`, { isActive: !plan.isActive }, { auth: true });
      await refreshPlans();
      toast.success("Status do plano atualizado.");
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar plano");
    } finally {
      setLoadingById((prev) => ({ ...prev, [plan.id]: false }));
    }
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setEditForm({
      name: plan?.name ?? "",
      amount: String(plan?.amount ?? ""),
      billingCycle: plan?.billingCycle ?? "",
      description: plan?.description ?? "",
    });
  }

  function closeEdit() {
    setEditingPlan(null);
  }

  async function saveEdit() {
    if (!canEdit || !editingPlan) return;

    setLoadingById((prev) => ({ ...prev, [editingPlan.id]: true }));
    try {
      if (editingPlan.__local) {
        const { getPlans, savePlans } = await import("@/lib/storage");
        const current = getPlans();
        const updated = (current || []).map((p) =>
          p.id === editingPlan.id
            ? {
                ...p,
                name: editForm.name,
                description: editForm.description,
                price: Number(editForm.amount),
              }
            : p,
        );
        savePlans(updated);
        await refreshPlans();
        toast.success("Plano atualizado (local).");
        closeEdit();
        return;
      }

      await api.patch(
        `/api/plans/${editingPlan.id}`,
        {
          name: editForm.name,
          description: editForm.description,
          amount: Number(editForm.amount),
          billingCycle: editForm.billingCycle,
        },
        { auth: true },
      );

      await refreshPlans();
      toast.success("Plano atualizado.");
      closeEdit();
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar plano");
    } finally {
      setLoadingById((prev) => ({ ...prev, [editingPlan.id]: false }));
    }
  }

  async function deletePlan(plan) {
    if (!canEdit) return;

    const ok = window.confirm(`Excluir o plano "${plan.name}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;

    setLoadingById((prev) => ({ ...prev, [plan.id]: true }));
    try {
      if (plan.__local) {
        const { getPlans, savePlans } = await import("@/lib/storage");
        const current = getPlans();
        savePlans((current || []).filter((p) => p.id !== plan.id));
        await refreshPlans();
        toast.success("Plano excluído (local).");
        return;
      }

      // Clean-kit mode: for local plans we manage localStorage only.
      // If you are in local mode (no backend), `refreshPlans()` should have marked plans with `__local`.
      // However, if the list came from the API earlier and you are now offline, we also support a local fallback.
      const result = await api.delete(`/api/plans/${plan.id}`, { auth: true }).catch(async () => {
        // fallback to local deletion if API is unavailable
        const { getPlans, savePlans } = await import("@/lib/storage");
        const current = getPlans();
        savePlans((current || []).filter((p) => p.id !== plan.id));
        return { __localFallback: true };
      });

      await refreshPlans();

      if (result?.deactivated) {
        toast.message("Esse plano tem assinaturas vinculadas e não pode ser excluído. Ele foi desativado.");
      } else if (result?.__localFallback) {
        toast.success("Plano excluído (local).");
      } else {
        toast.success("Plano excluído.");
      }
    } catch (err) {
      toast.error(err.message || "Erro ao excluir plano");
    } finally {
      setLoadingById((prev) => ({ ...prev, [plan.id]: false }));
    }
  }

  return (
    <AppShell>
      <CheckoutModal
        open={checkoutOpen}
        onClose={closeCheckout}
        plan={selectedPlan}
        isProcessing={checkoutLoading}
        onConfirm={() => createCheckout(selectedPlan)}
      />

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Editar plano</h3>
                  <p className="text-slate-400 text-sm mt-1">{editingPlan.name}</p>
                </div>
                <button type="button" onClick={closeEdit} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm">
                  Fechar
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <Field label="Nome">
                  <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="field" />
                </Field>

                <Field label="Preço (amount)">
                  <input value={editForm.amount} onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))} className="field" />
                </Field>

                {!editingPlan.__local && (
                  <Field label="Ciclo de cobrança (billingCycle)">
                    <input
                      value={editForm.billingCycle}
                      onChange={(e) => setEditForm((p) => ({ ...p, billingCycle: e.target.value }))}
                      className="field"
                    />
                  </Field>
                )}

                <Field label="Descrição">
                  <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="field min-h-24" />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={closeEdit} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(loadingById[editingPlan.id])}
                    onClick={saveEdit}
                    className="rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-3 text-sm font-semibold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section>
          <h2 className="text-3xl font-bold">Planos</h2>
          <p className="text-slate-400 mt-2">Área para visualizar e gerenciar os planos da aplicação.</p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-slate-400 mt-2">{plan.description}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      plan.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {plan.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <p className="text-3xl font-bold mt-6">{formatCurrency(Number(plan.amount))}</p>
                <p className="text-slate-500 text-sm">{plan.billingCycle}</p>

                {(canEdit || canSubscribe) && (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {canSubscribe && (
                      <button
                        type="button"
                        disabled={Boolean(loadingById[plan.id]) || !plan.isActive || plan.__local}
                        onClick={() => openCheckout(plan)}
                        className="rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-3 text-sm font-semibold"
                        title={plan.__local ? "Planos locais não suportam checkout" : undefined}
                      >
                        Assinar
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          disabled={Boolean(loadingById[plan.id])}
                          onClick={() => togglePlan(plan)}
                          className="rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-4 py-3 text-sm font-semibold"
                        >
                          {plan.isActive ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(loadingById[plan.id])}
                          onClick={() => openEdit(plan)}
                          className="rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-4 py-3 text-sm font-semibold inline-flex items-center gap-2"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(loadingById[plan.id])}
                          onClick={() => deletePlan(plan)}
                          className="rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-40 px-4 py-3 text-sm font-semibold inline-flex items-center gap-2"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6 h-fit">
          <h3 className="text-xl font-semibold">Novo plano</h3>
          <p className="text-slate-400 text-sm mt-2">Disponível apenas para admin.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <Field label="Nome">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" disabled={!canEdit} />
            </Field>
            <Field label="Preço">
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="field" disabled={!canEdit} />
            </Field>
            <Field label="Duração (dias)">
              <input
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                className="field"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Descrição">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field min-h-24" disabled={!canEdit} />
            </Field>
            <Field label="Features (uma por linha)">
              <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="field min-h-28" disabled={!canEdit} />
            </Field>
            <button disabled={!canEdit} className="w-full rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-3 font-semibold">
              Criar plano
            </button>
          </form>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
