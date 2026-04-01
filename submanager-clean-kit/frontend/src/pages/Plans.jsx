import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/api/plans");
        const list = Array.isArray(response?.plans) ? response.plans : Array.isArray(response) ? response : [];
        setPlans(list);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const visiblePlans = useMemo(() => plans.filter(Boolean), [plans]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Planos</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Escolha um plano</h1>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-300">Carregando planos...</div>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-300">Nenhum plano disponível.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
