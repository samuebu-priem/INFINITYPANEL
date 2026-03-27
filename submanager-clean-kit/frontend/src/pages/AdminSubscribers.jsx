import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function AdminSubscribers() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/admin/subscribers");
        setItems(Array.isArray(response.data?.subscribers) ? response.data.subscribers : []);
      } catch {
        setItems([]);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Assinantes</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Lista de assinaturas</h1>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        {items.length === 0 ? (
          <p className="text-slate-400">Nenhum assinante encontrado.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">{item.name || item.email}</p>
                <p className="text-sm text-slate-400">{item.planName || "Plano"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
