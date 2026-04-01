import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";

const DEFAULT_VPS_DAYS = Number(import.meta.env.VITE_VPS_DAYS_DEFAULT || 30);

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [discordNick, setDiscordNick] = useState("");
  const [savingDiscordNick, setSavingDiscordNick] = useState(false);
  const [discordMessage, setDiscordMessage] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/plans");
        const list = Array.isArray(response?.plans) ? response.plans : Array.isArray(response) ? response : [];
        setPlans(list);
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscription(response?.subscription ?? null);
      } catch {
        setSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadPlans();
    loadSubscription();
  }, []);

  useEffect(() => {
    const currentDiscordNick =
      user?.nickname ||
      user?.discordNick ||
      user?.discordNickname ||
      user?.metadata?.discordNick ||
      user?.metadata?.discordNickname ||
      "";
    setDiscordNick(String(currentDiscordNick || ""));
  }, [user]);

  const vpsDaysRemaining = useMemo(() => {
    const endsAt = subscription?.endsAt ? new Date(subscription.endsAt) : null;
    if (!endsAt || Number.isNaN(endsAt.getTime())) return DEFAULT_VPS_DAYS;
    const diff = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  }, [subscription]);

  const visiblePlans = useMemo(() => plans.filter(Boolean), [plans]);

  const handleSaveDiscordNick = async (event) => {
    event.preventDefault();
    setSavingDiscordNick(true);
    setDiscordMessage("");

    try {
      await api.patch("/users/me", {
        nickname: discordNick,
        discordNick,
        discordNickname: discordNick,
      });
      setDiscordMessage("Nick do Discord salvo com sucesso.");
    } catch {
      setDiscordMessage("Não foi possível salvar o nick do Discord com o backend atual.");
    } finally {
      setSavingDiscordNick(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Bem-vindo</p>
        <h1 className="mt-1 text-3xl font-bold text-white">{user?.name || "InfinityPainel"}</h1>
        <p className="mt-2 text-sm text-slate-400">Acesse seus planos e acompanhe suas assinaturas.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">VPS</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Dias restantes</h2>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Tempo corrido</p>
              <p className="text-3xl font-bold text-white">{vpsDaysRemaining}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            {loadingSubscription
              ? "Carregando assinatura..."
              : subscription?.endsAt
                ? `Assinatura ativa até ${new Date(subscription.endsAt).toLocaleDateString("pt-BR")}.`
                : "Sem assinatura ativa encontrada. O contador usa um valor configurável no frontend até existir um endpoint dedicado."}
          </p>
        </div>

        <form onSubmit={handleSaveDiscordNick} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Perfil</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Nick do Discord</h2>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm text-slate-300">Discord nick</span>
            <input
              type="text"
              className="field"
              value={discordNick}
              onChange={(event) => setDiscordNick(event.target.value)}
              placeholder="Seu nick do Discord"
            />
          </label>

          <button
            type="submit"
            disabled={savingDiscordNick}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDiscordNick ? "Salvando..." : "Salvar nick"}
          </button>

          {discordMessage ? <p className="mt-3 text-sm text-slate-400">{discordMessage}</p> : null}
        </form>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Planos</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Mesmo padrão visual da aba Planos</h2>
          </div>
        </div>

        {loadingPlans ? (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-slate-300">
            Carregando planos...
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-slate-300">
            Nenhum plano disponível.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
