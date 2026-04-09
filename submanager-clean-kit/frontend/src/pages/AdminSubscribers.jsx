import { useEffect, useState } from "react";
import { api } from "../services/api.js";

function getUsersList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export default function AdminSubscribers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const response = await api.get("/users");
        const users = getUsersList(response);
        setItems(users.filter((user) => user?.role === "ADMIN" || user?.role === "OWNER"));
      } catch (err) {
        setItems([]);
        setError(err?.response?.data?.message || "Não foi possível carregar os usuários administrativos.");
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-[#9ca3af]">Administração</p>
        <h1 className="mt-1 text-3xl font-bold text-[#f3f4f6]">Usuários administrativos</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Esta tela mostra apenas usuários retornados pela API atual.
        </p>
      </div>

      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6">
        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
        {items.length === 0 ? (
          <p className="text-[#9ca3af]">Nenhum usuário ADMIN ou OWNER encontrado.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#1f2937] bg-[#0f141c] p-4">
                <p className="font-semibold text-[#f3f4f6]">{item.username || item.email}</p>
                <p className="text-sm text-[#9ca3af]">{item.email}</p>
                <p className="text-xs text-[#6b7280]">role: {item.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}