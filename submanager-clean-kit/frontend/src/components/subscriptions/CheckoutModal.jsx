import { X } from "lucide-react";
import { formatCurrency } from "@/utils";

const methods = [
  { value: "pix", label: "PIX", description: "Ideal para um checkout rápido." },
  { value: "card", label: "Cartão", description: "Perfeito para futura recorrência." },
  { value: "boleto", label: "Boleto", description: "Bom para clientes que preferem vencimento." },
];

function CopyableField({ label, value }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value || ""));
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-700"
        >
          Copiar
        </button>
      </div>
      <p className="mt-2 break-all text-sm text-slate-200">{value}</p>
    </div>
  );
}

export default function CheckoutModal({ open, onClose, plan, onConfirm, isProcessing }) {
  if (!open || !plan) return null;

  const checkout = plan.checkout ?? null;
  const checkoutUrl = checkout?.checkoutUrl ?? checkout?.paymentUrl ?? checkout?.url ?? null;
  const qrCode = checkout?.qrCode ?? checkout?.qr_code ?? checkout?.copyPaste ?? null;
  const qrCodeBase64 = checkout?.qrCodeBase64 ?? checkout?.qr_code_base64 ?? null;
  const status = checkout?.status ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Checkout</p>
            <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 p-2 transition hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Resumo</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-slate-200">{plan.description}</span>
            <strong className="text-white">{formatCurrency(plan.price ?? plan.amount ?? 0)}</strong>
          </div>
        </div>

        {checkout ? (
          <div className="space-y-4">
            {status && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                Pagamento: {status}
              </div>
            )}

            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-2xl bg-sky-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-sky-500"
              >
                Ir para pagamento
              </a>
            )}

            {qrCodeBase64 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="mb-3 text-sm text-slate-400">PIX QR Code</p>
                <img
                  alt="PIX QR Code"
                  className="mx-auto w-full max-w-xs rounded-xl bg-white p-2"
                  src={`data:image/png;base64,${qrCodeBase64}`}
                />
              </div>
            )}

            {qrCode && <CopyableField label="Copia e cola (PIX)" value={qrCode} />}
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.value}
                disabled={isProcessing}
                onClick={() => onConfirm(method.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-left transition hover:border-sky-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="font-semibold text-white">Pagar com {method.label}</p>
                <p className="text-sm text-slate-500">{method.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
