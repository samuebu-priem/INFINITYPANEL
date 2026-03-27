import { Pencil, Trash2 } from "lucide-react";

function getQuantity(plan) {
  if (typeof plan?.quantity === "number") return plan.quantity;
  if (typeof plan?.stock === "number") return plan.stock;
  if (typeof plan?.availableSlots === "number") return plan.availableSlots;
  if (typeof plan?.metadata?.stock === "number") return plan.metadata.stock;
  return 0;
}

export default function PlanCard({ plan, onSubscribe, canManage, onEdit, onDelete, deleting }) {
  const quantity = getQuantity(plan);
  const isAvailable = quantity > 0;
  const amount = Number(plan?.amount ?? 0);

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{plan?.name}</h3>
          {plan?.description ? <p className="mt-2 text-sm text-slate-400">{plan.description}</p> : null}
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{plan?.billingCycle}</p>
          <p className="text-lg font-semibold text-white">R$ {amount.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <span className={isAvailable ? "text-emerald-400" : "text-rose-400"}>
          {isAvailable ? `Vagas disponíveis: ${quantity}` : "Indisponível"}
        </span>
        <span className={plan?.isActive === false ? "text-slate-500" : "text-slate-300"}>
          {plan?.isActive === false ? "Inativo" : "Ativo"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubscribe}
          disabled={!isAvailable}
          className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          Assinar agora
        </button>

        {canManage && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-white transition hover:border-slate-600 hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 font-semibold text-rose-200 transition hover:border-rose-700 hover:bg-rose-900/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
