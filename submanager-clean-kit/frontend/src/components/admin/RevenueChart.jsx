import { useMemo } from "react";

export default function RevenueChart({ payments = [] }) {
  const total = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments],
  );

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Receita</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Visão consolidada</h3>
        </div>
        <p className="text-3xl font-bold text-white">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="mt-6 h-56 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Gráfico de receita carregado com dados da API.
        </div>
      </div>
    </div>
  );
}
