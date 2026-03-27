import { Check } from "lucide-react";
import { formatCurrency } from "@/utils";

export default function PlanCard({ plan, isPopular = false, onSelect, onEdit, canEdit = false }) {
  const amount = Number(plan?.price ?? plan?.amount ?? 0);
  const billingLabel = plan?.duration_days ? `a cada ${plan.duration_days} dias` : plan?.billingCycle ?? "";
  const features = Array.isArray(plan?.features) ? plan.features : [];
  const hasPlanName = Boolean(plan?.name?.trim());

  return (
    <div
      className={`rounded-[2rem] border ${isPopular ? "border-sky-500/80" : "border-slate-800"} bg-slate-900 p-6 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/25`}
    >
      {isPopular && (
        <span className="mb-4 inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
          Mais escolhido
        </span>
      )}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white">{hasPlanName ? plan.name : "Plano"}</h3>
        <p className="min-h-12 text-slate-400">{plan?.description ?? "Detalhes do plano disponíveis na seleção."}</p>
      </div>

      <div className="mt-6">
        <p className="text-3xl font-extrabold text-white">{formatCurrency(amount)}</p>
        <p className="text-sm text-slate-500">{billingLabel}</p>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        {features.length === 0 ? (
          <p className="text-sm text-slate-500">Recursos exibidos no checkout.</p>
        ) : (
          features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{feature}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <button
          onClick={() => onSelect?.(plan)}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-500"
        >
          Assinar agora
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit?.(plan)}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
