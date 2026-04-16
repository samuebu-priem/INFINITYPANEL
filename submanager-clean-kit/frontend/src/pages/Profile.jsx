
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

/* ================= HELPERS ================= */

function getSubscriptionsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subscriptions)) return response.subscriptions;
  if (response?.subscription) return [response.subscription];
  return [];
}

function getSummaryObject(response) {
  if (!response) return null;
  if (response.summary) return response.summary;
  if (response.data?.summary) return response.data.summary;
  if (response.data) return response.data;
  return response;
}

function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (subscription?.isActive) return true;

  const status = String(subscription?.status || "").toUpperCase();
  if (status !== "ACTIVE") return false;

  const end = new Date(subscription?.endsAt || 0);
  return end.getTime() > Date.now();
}

function formatNumber(v) {
  return new Intl.NumberFormat("pt-BR").format(Number(v || 0));
}

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v || 0));
}

/* ================= COMPONENT ================= */

export default function Profile() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    async function load() {
      try {
        const [subs, sum] = await Promise.all([
          api.get("/subscriptions/me", { auth: true }),
          api.get("/profile/summary", { auth: true }),
        ]);

        setSubscriptions(getSubscriptionsList(subs));
        setSummary(getSummaryObject(sum));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ================= DISCORD ================= */

  const handleConnectDiscord = async () => {
    const res = await api.get("/auth/discord/url", { auth: true });
    if (res?.url) window.location.href = res.url;
  };

  const handleDisconnectDiscord = async () => {
    await api.delete("/profile/discord", { auth: true });
    window.location.reload();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    async function connect() {
      await api.post("/profile/discord/refresh", {}, { auth: true });
      window.history.replaceState({}, document.title, "/profile");
      window.location.reload();
    }

    connect();
  }, []);

  /* ================= DATA ================= */

  const activeSubs = useMemo(
    () => subscriptions.filter(isSubscriptionActive),
    [subscriptions]
  );

  const wins = summary?.wins || 0;
  const matches = summary?.matchesPlayed || 0;
  const profit = summary?.mediatorProfitTotal || 0;
  const mediated = summary?.mediatedMatchesCount || 0;

  /* ================= UI ================= */

  return (
    <div className="min-h-screen text-white px-4 py-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          {user?.username}
        </h1>
        <p className="text-sm text-zinc-400">
          Sua presença na Infinity
        </p>
      </div>

      {/* DISCORD */}
      <div className="bg-zinc-900 rounded-2xl p-4">

        {summary?.discordId ? (
          <div className="flex items-center gap-4">

            <img
              src={`https://cdn.discordapp.com/avatars/${summary.discordId}/${summary.discordAvatar}.png`}
              className="w-14 h-14 rounded-full"
            />

            <div>
              <div className="font-bold">
                {summary.discordUsername}
              </div>
              <div className="text-sm text-green-400">
                conectado
              </div>
            </div>

            <button
              onClick={handleDisconnectDiscord}
              className="ml-auto bg-red-500 px-3 py-2 rounded-lg text-sm font-bold"
            >
              Desconectar
            </button>

          </div>
        ) : (
          <button
            onClick={handleConnectDiscord}
            className="w-full h-12 bg-indigo-600 rounded-xl font-bold"
          >
            Conectar com Discord
          </button>
        )}

      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 gap-3">

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-xs text-zinc-400">vitórias</p>
          <p className="text-xl font-bold">{formatNumber(wins)}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-xs text-zinc-400">partidas</p>
          <p className="text-xl font-bold">{formatNumber(matches)}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-xs text-zinc-400">mediadas</p>
          <p className="text-xl font-bold">{formatNumber(mediated)}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-xs text-zinc-400">lucro</p>
          <p className="text-xl font-bold text-green-400">
            {formatCurrency(profit)}
          </p>
        </div>

      </div>

      {/* ACESSOS */}
      <div className="bg-zinc-900 rounded-2xl p-4">

        <p className="font-bold mb-3">
          teus acessos
        </p>

        {loading ? (
          <p>carregando...</p>
        ) : activeSubs.length ? (
          activeSubs.map((sub, i) => (
            <div
              key={i}
              className="bg-zinc-800 p-3 rounded-lg mb-2"
            >
              {sub.plan?.name}
            </div>
          ))
        ) : (
          <p className="text-zinc-400">
            sem acesso ativo
          </p>
        )}

      </div>

    </div>
  );
}