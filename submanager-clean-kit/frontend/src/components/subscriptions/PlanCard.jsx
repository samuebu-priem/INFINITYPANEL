import { useState } from "react";
import CheckoutModal from "./CheckoutModal.jsx";

function normalizeFeatures(plan) {
  const raw =
    plan?.features ||
    plan?.metadata?.features ||
    plan?.metadata?.items ||
    plan?.metadata?.benefits ||
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

function normalizeDays(plan) {
  const days =
    Number(plan?.days) ||
    Number(plan?.durationDays) ||
    Number(plan?.validityDays) ||
    Number(plan?.metadata?.days) ||
    Number(plan?.metadata?.durationDays) ||
    Number(plan?.metadata?.validityDays) ||
    0;

  return Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
}

function normalizeStock(plan) {
  const stock =
    Number(plan?.quantity) ||
    Number(plan?.stock) ||
    Number(plan?.metadata?.stock) ||
    Number(plan?.metadata?.inventory) ||
    Number(plan?.quantityAvailable) ||
    0;

  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0;
}

function normalizeOriginalAmount(plan) {
  const raw =
    plan?.originalAmount ??
    plan?.oldAmount ??
    plan?.metadata?.originalAmount ??
    plan?.metadata?.oldAmount ??
    plan?.metadata?.promotionalPrice ??
    plan?.metadata?.originalPrice;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function PlanCard({ plan, user, showCheckout = true }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isActive = plan?.isActive !== false;
  const days = normalizeDays(plan);
  const features = normalizeFeatures(plan);
  const stock = normalizeStock(plan);
  const originalAmount = normalizeOriginalAmount(plan);

  return (
    <>
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-white">{plan?.name || "Plano"}</p>
            <p className="mt-1 text-sm text-slate-400">{plan?.description || "Acesso simples e direto."}</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-700 bg-slate-800 text-slate-400"
            }`}
          >
            {isActive ? "Disponível" : "Indisponível"}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Preço</p>
            <div className="mt-1 flex items-end gap-2">
              {originalAmount > 0 ? (
                <span className="text-sm text-slate-500 line-through">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: plan?.currency || "BRL",
                  }).format(originalAmount)}
                </span>
              ) : null}
              <span className="text-3xl font-bold text-white">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: plan?.currency || "BRL",
                }).format(Number(plan?.amount || 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <span className="text-sm text-slate-400">Validade</span>
            <span className="text-sm font-semibold text-white">{days > 0 ? `${days} dias` : "Não informado"}</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <span className="text-sm text-slate-400">Estoque</span>
            <span className="text-sm font-semibold text-white">{stock > 0 ? `${stock} unidades` : "Sem limite definido"}</span>
          </div>
        </div>

        {features.length > 0 ? (
          <div className="mt-5">
            <p className="text-sm text-slate-400">Features</p>
            <ul className="mt-3 space-y-2">
              {features.slice(0, 5).map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showCheckout && isActive ? (
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500"
          >
            {user?.role === "ADMIN" ? "Gerenciar" : "Assinar plano"}
          </button>
        ) : null}
      </div>

      <CheckoutModal plan={plan} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
