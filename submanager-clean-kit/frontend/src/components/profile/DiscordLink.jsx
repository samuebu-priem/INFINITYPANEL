import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../services/api.js";

export default function DiscordLink({ onUpdate }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/me");
        setValue(response.data?.user?.discordId || "");
      } catch {
        setValue("");
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await api.patch("/auth/me/discord", {
        discordId: value.trim() || null,
      });
      const updatedDiscordId = response.data?.user?.discordId || null;
      onUpdate?.(updatedDiscordId);
      setValue(updatedDiscordId || "");
      toast.success("Discord atualizado.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível atualizar o Discord.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <p className="mb-3 text-sm text-slate-400">Discord</p>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field flex-1"
          placeholder="Usuário ou ID"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
