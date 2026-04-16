
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { UserHomeFooter } from "../components/layout/UserHomeFooter.jsx";

/* ================= HELPERS ================= */

function getPlansList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.plans)) return res.plans;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function getSubscriptionsList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.subscriptions)) return res.subscriptions;
  if (res?.subscription) return [res.subscription];
  return [];
}

function isSubscriptionActive(sub) {
  if (!sub) return false;
  if (sub?.isActive) return true;

  const end = new Date(sub?.endsAt || 0);
  return end.getTime() > Date.now();
}

function normalizeRanking(item, i) {
  return {
    name: item?.username || "player",
    wins: Number(item?.wins || 0),
    position: i + 1,
  };
}

/* ================= COMPONENT ================= */

export default function UserHome() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [p, s, r] = await Promise.all([
        api.get("/plans"),
        api.get("/subscriptions/me", { auth: true }),
        api.get("/rankings/public"),
      ]);

      setPlans(getPlansList(p));
      setSubs(getSubscriptionsList(s));
      setRanking((r?.ranking || []).map(normalizeRanking));
    } catch (e) {
      console.error(e);
    }
  }

  const activeSubs = useMemo(
    () => subs.filter(isSubscriptionActive),
    [subs]
  );

  const top3 = ranking.slice(0, 3);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen text-white px-4 py-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          Fala, {user?.username}
        </h1>
        <p className="text-sm text-zinc-400">
          Bora dominar hoje?
        </p>
      </div>

      {/* ACESSO */}
      <div className="bg-zinc-900 p-4 rounded-xl">
        <p className="text-sm text-zinc-400">teu acesso</p>
        <p className="font-bold">
          {activeSubs.length
            ? activeSubs[0]?.plan?.name
            : "sem acesso"}
        </p>
      </div>

      {/* PÓDIO */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-4 mt-6">

          {/* #2 */}
          {top3[1] && (
            <div className="text-center">
              <div className="bg-zinc-800 p-3 rounded-xl w-24 scale-95">
                <p className="text-xs text-zinc-400">#2</p>
                <p className="font-bold text-sm">
                  {top3[1].name}
                </p>
                <p className="text-green-400 text-xs">
                  {top3[1].wins} wins
                </p>
              </div>
            </div>
          )}

          {/* #1 */}
          {top3[0] && (
            <div className="text-center">
              <div className="bg-zinc-700 p-4 rounded-2xl w-28 scale-110 shadow-lg">
                <p className="text-yellow-400 font-bold">#1</p>
                <p className="font-bold">
                  {top3[0].name}
                </p>
                <p className="text-green-400">
                  {top3[0].wins} wins
                </p>
              </div>
            </div>
          )}

          {/* #3 */}
          {top3[2] && (
            <div className="text-center">
              <div className="bg-zinc-800 p-3 rounded-xl w-24 scale-95">
                <p className="text-xs text-zinc-400">#3</p>
                <p className="font-bold text-sm">
                  {top3[2].name}
                </p>
                <p className="text-green-400 text-xs">
                  {top3[2].wins} wins
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* PLANOS */}
      <div>
        <h2 className="font-bold mb-3">
          entra pra jogar
        </h2>

        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      <UserHomeFooter />
    </div>
  );
}