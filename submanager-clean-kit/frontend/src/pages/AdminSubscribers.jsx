import { useEffect, useState } from "react";
import AppShell from "@/layouts/AppShell";
import { api } from "@/services/api";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);

  useEffect(() => {
    api.get("/api/subscribers", { auth: true }).then((data) => {
      setSubscribers(Array.isArray(data?.subscribers) ? data.subscribers : []);
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Assinantes</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Gerenciamento de assinantes</h2>
          <p className="mt-2 text-slate-400">Lista consolidada com acabamento visual mais limpo.</p>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
          <div className="space-y-3">
            {subscribers.length === 0 ? (
              <p className="text-slate-500">Nenhum assinante encontrado.</p>
            ) : (
              subscribers.map((subscriber) => (
                <div key={subscriber.id} className="rounded-2xl border border-slate-800 p-4">
                  <p className="font-medium text-white">{subscriber.email ?? subscriber.user_email ?? "—"}</p>
                  <p className="text-sm text-slate-400">{subscriber.name ?? subscriber.username ?? "Usuário"}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
