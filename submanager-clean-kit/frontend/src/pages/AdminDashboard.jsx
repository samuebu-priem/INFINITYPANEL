import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    plans: 0,
    activePlans: 0,
    subscriptions: 0,
    revenue: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
       const plans = await api.get("/plans");
const subscriptions = await api.get("/subscriptions");
const payments = await api.get("/payments");
      } catch {
        setStats({ plans: 0, activePlans: 0, subscriptions: 0, revenue: 0 });
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Painel administrativo</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Visão geral</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Planos</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.plans}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Ativos</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.activePlans}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Assinaturas</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.subscriptions}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Receita</p>
          <p className="mt-2 text-3xl font-bold text-white">R$ {Number(stats.revenue).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
