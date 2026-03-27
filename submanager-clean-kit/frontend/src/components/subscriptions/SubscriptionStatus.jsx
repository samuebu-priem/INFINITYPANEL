import { formatCurrency, formatDate } from "@/utils";

export default function SubscriptionStatus({ subscription }) {
  if (!subscription) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-300 shadow-lg shadow-black/20">
        <h3 className="mb-2 text-xl font-semibold text-white">Nenhuma assinatura ativa</h3>
        <p className="text-slate-400">Escolha um plano abaixo para ativar sua conta.</p>
      </div>
    );
  }

  const startDate = subscription.start_date ?? subscription.startsAt ?? subscription.startDate ?? subscription.createdAt;
  const endDate = subscription.end_date ?? subscription.endsAt ?? subscription.endDate;
  const status = subscription.status ?? subscription.payment_status ?? "active";
  const amount = Number(subscription.amount_paid ?? subscription.amountPaid ?? subscription.plan_amount ?? 0);

  return (
    <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-300">Assinatura ativa</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{subscription.plan_name ?? subscription.plan?.name ?? "Plano"}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Valor pago</p>
          <p className="text-xl font-semibold text-white">{formatCurrency(amount)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
        <Info label="Início" value={formatDate(startDate)} />
        <Info label="Vencimento" value={formatDate(endDate)} />
        <Info label="Status" value={status} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
