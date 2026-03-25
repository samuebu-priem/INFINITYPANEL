import { useEffect, useState } from "react";
import { getCurrentUser, setCurrentUser } from "@/lib/storage";
import { toast } from "sonner";

export default function DiscordLink({ onUpdate }) {
  const currentUser = getCurrentUser();
  const [value, setValue] = useState(currentUser?.discord_id || "");

  useEffect(() => {
    setValue(currentUser?.discord_id || "");
  }, [currentUser?.discord_id]);

  const handleSave = () => {
    const updated = { ...currentUser, discord_id: value || null };
    setCurrentUser(updated);
    onUpdate?.(updated.discord_id);
    toast.success("Discord atualizado com sucesso.");
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-slate-400 text-sm mb-3">Vincule seu Discord para suporte e comunidade.</p>
      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
          placeholder="ex: usuario#1234 ou id"
        />
        <button onClick={handleSave} className="rounded-2xl bg-sky-600 hover:bg-sky-500 px-5 py-3 font-semibold">
          Salvar
        </button>
      </div>
    </div>
  );
}
