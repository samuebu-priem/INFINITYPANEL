import { Check } from "lucide-react";
import { formatCurrency } from "@/utils";

export default function PlanCard({ plan, isPopular = false, onSelect }) {
  return (
    <div className={`rounded-3xl border ${isPopular ? "border-sky-500" : "border-slate-800"} bg-slate-900 p-6`}>
      {isPopular && (
        <span className="inline-flex mb-4 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-semibold">
          Mais escolhido
        </span>
      )}
      <h3 className="text-2xl font-bold">{plan.name}</h3>
      <p className="text-slate-400 mt-2 min-h-12">{plan.description}</p>
      <p className="text-3xl font-extrabold mt-6">{formatCurrency(plan.price)}</p>
      <p className="text-slate-500 text-sm">a cada {plan.duration_days} dias</p>

      <div className="space-y-3 mt-6">
        {(plan.features || []).map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-emerald-400" />
            {feature}
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(plan)}
        className="mt-8 w-full rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3 font-semibold"
      >
        Assinar agora
      </button>
    </div>
  );
}
