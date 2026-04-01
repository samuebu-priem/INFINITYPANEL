import { useMemo, useState } from "react";
import { api } from "../../services/api.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export default function CheckoutModal({ plan, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const amountLabel = useMemo(() => formatCurrency(plan?.amount), [plan]);

  if (!open || !plan) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/checkout", { planId: plan.id });

      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      if (typeof onSuccess === "function") onSuccess(response);
      setMessage("Checkout iniciado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar o checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Checkout</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{plan.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-700"
          >
            Fechar
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Preço</p>
          <p className="mt-1 text-3xl font-bold text-white">{amountLabel}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Dias disponíveis</p>
          <p className="mt-1 text-lg font-semibold text-white">{Number(plan?.quantity || 0)} dias</p>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Iniciando..." : "Assinar agora"}
        </button>

        {message ? <p className="mt-4 text-sm text-slate-400">{message}</p> : null}
      </div>
    </div>
  );
}
