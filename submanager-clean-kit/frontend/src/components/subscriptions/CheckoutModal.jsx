import { X } from "lucide-react";

function getQuantity(plan) {
  if (typeof plan?.quantity === "number") return plan.quantity;
  if (typeof plan?.stock === "number") return plan.stock;
  if (typeof plan?.availableSlots === "number") return plan.availableSlots;
  if (typeof plan?.metadata?.stock === "number") return plan.metadata.stock;
  return 0;
}

export default function CheckoutModal({ open, plan, onClose }) {
  if (!open || !plan) return null;

  const quantity = getQuantity(plan);
  const disabled = quantity <= 0;
  const amount = Number(plan?.amount ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">Finalizar assinatura</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{plan.name}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Valor</p>
            <p className="mt-1 text-xl font-semibold text-white">R$ {amount.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-400">Disponibilidade</p>
            <p className={`mt-1 text-xl font-semibold ${disabled ? "text-rose-400" : "text-emerald-400"}`}>
              {disabled ? "Indisponível" : `Vagas disponíveis: ${quantity}`}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          {disabled ? "Este plano está indisponível no momento." : "Escolha a forma de pagamento para continuar."}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500"
          >
            {disabled ? "Fechar" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
