import { useMemo, useState } from "react";
import AppShell from "@/layouts/AppShell";
import { deleteSubscription, renewSubscription, revokeSubscription } from "@/lib/adminAction";
import { getSubscriptions } from "@/lib/storage";
import { formatDate } from "@/utils";

export default function AdminSubscribers() {
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);

  const subscriptions = getSubscriptions();
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const rows = subscriptions.slice().reverse();
    if (!normalizedQuery) return rows;

    return rows.filter((s) => {
      const hay = [
        s.user_email,
        s.plan_name,
        s.status,
        s.id,
        s.plan_id,
        s.start_date,
        s.end_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(normalizedQuery);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, refresh]);

  function forceRefresh() {
    setRefresh((v) => v + 1);
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Assinantes</h2>
            <p className="text-slate-400 mt-2">Gerencie assinaturas com controle total (local).</p>
          </div>

          <div className="w-full md:w-96">
            <label className="text-sm text-slate-400">Buscar</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
              placeholder="email, plano, status..."
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          {filtered.length === 0 ? (
            <p className="text-slate-500">Nenhuma assinatura encontrada.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.user_email}</p>
                      <p className="text-sm text-slate-400 truncate">{s.plan_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Início: {formatDate(s.start_date)} • Fim: {formatDate(s.end_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={[
                          "text-xs px-3 py-1 rounded-full border",
                          s.status === "active"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : s.status === "revoked"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                              : "bg-slate-500/10 text-slate-300 border-slate-500/20",
                        ].join(" ")}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        renewSubscription(s.id, 30);
                        forceRefresh();
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold"
                    >
                      Renovar +30d
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        revokeSubscription(s.id);
                        forceRefresh();
                      }}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold"
                    >
                      Revogar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const ok = window.confirm(`Excluir assinatura de "${s.user_email}"?`);
                        if (!ok) return;
                        deleteSubscription(s.id);
                        forceRefresh();
                      }}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
