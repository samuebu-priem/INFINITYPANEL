import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../services/api.js";
import { CheckoutModal } from "./CheckoutModal.jsx";

function formatPrice(value) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PlanCard({ plan, user }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableSlots = useMemo(() => Number(plan?.availableSlots ?? plan?.quantity ?? plan?.stock ?? 0), [plan]);
  const isUnavailable = availableSlots <= 0 || plan?.isActive === false;

  const handleBuy = async () => {
    if (isUnavailable || submitting) return;

    if (!user) {
      toast.error("Entre para continuar.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/checkout", { planId: plan.id });
      toast.success("Pedido iniciado.");
      setCheckoutOpen(true);
    } catch (error) {
      toast.error(error?.message || "Não foi possível iniciar a compra.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Plano</p>
            <h3 className="mt-1 text-2xl font-bold text-white">{plan?.name}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isUnavailable ? "bg-slate-800 text-slate-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {isUnavailable ? "Indisponível" : "Disponível"}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="text-3xl font-black text-white">{formatPrice(plan?.price)}</div>
          <p className="text-sm text-slate-400">{plan?.description || "Plano disponível na plataforma."}</p>
          <p className="text-sm font-medium text-slate-300">
            {isUnavailable ? "Indisponível" : `Vagas disponíveis: ${availableSlots}`}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBuy}
            disabled={isUnavailable || submitting}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processando..." : "Assinar"}
          </button>
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            Ver
          </button>
        </div>
      </div>

      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} plan={plan} user={user} />
    </>
  );
}
