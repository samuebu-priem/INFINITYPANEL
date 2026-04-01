import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function UserHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setUser(response?.user || null);
      } catch {
        setUser(null);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-slate-400">Bem-vindo</p>
        <h1 className="mt-1 text-3xl font-bold text-white">{user?.name || "InfinityPainel"}</h1>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
        <p className="text-slate-400">Acesse seus planos e acompanhe suas assinaturas.</p>
      </div>
    </div>
  );
}
