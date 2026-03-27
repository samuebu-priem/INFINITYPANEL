import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DiscordLink({ onUpdate }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(window.localStorage.getItem("submanager_user") || "null");
    setValue(storedUser?.discord_id || "");
  }, []);

  const handleSave = () => {
    const storedUser = JSON.parse(window.localStorage.getItem("submanager_user") || "null");
    const updated = { ...storedUser, discord_id: value || null };
    window.localStorage.setItem("submanager_user", JSON.stringify(updated));
    onUpdate?.(updated.discord_id);
    toast.success("Discord atualizado com sucesso.");
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <p className="mb-3 text-sm text-slate-400">Vincule seu Discord para suporte e comunidade.</p>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field flex-1"
          placeholder="ex: usuario#1234 ou id"
        />
        <button
          onClick={handleSave}
          className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
