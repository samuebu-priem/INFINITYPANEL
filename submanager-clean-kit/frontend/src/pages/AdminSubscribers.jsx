import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function AdminSubscribers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const response = await api.get("/users");
        const users = Array.isArray(response?.users) ? response.users : [];
        setItems(users.filter((user) => user?.role === "ADMIN"));
      } catch (err) {
        setItems([]);
        setError(err?.response?.data?.message || "Não foi possível carregar os admins.");
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
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
        {items.length === 0 ? (
          <p className="text-slate-400">Nenhum admin encontrado.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">{item.username || item.email}</p>
                <p className="text-sm text-slate-400">{item.email}</p>
                <p className="text-xs text-slate-500">role: {item.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
