import { formatCurrency, formatDate } from "@/utils";

export default function SubscriptionStatus({ subscription }) {
  if (!subscription) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        <h3 className="text-xl font-semibold mb-2">Nenhuma assinatura ativa</h3>
        <p className="text-slate-400">Escolha um plano abaixo para ativar sua conta.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-300">Assinatura ativa</p>
          <h3 className="text-2xl font-bold mt-1">{subscription.plan_name}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Valor pago</p>
          <p className="text-xl font-semibold">{formatCurrency(subscription.amount_paid)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
        <Info label="Início" value={formatDate(subscription.start_date)} />
        <Info label="Vencimento" value={formatDate(subscription.end_date)} />
        <Info label="Status" value={subscription.payment_status || "paid"} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold mt-1">{value}</p>
    </div>
  );
}
