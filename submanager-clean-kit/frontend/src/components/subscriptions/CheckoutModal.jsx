import { X } from "lucide-react";
import { formatCurrency } from "@/utils";

const methods = [
  { value: "pix", label: "PIX" },
  { value: "card", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
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
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-slate-400 text-sm">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          Copiar
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-200 break-all">{value}</p>
    </div>
  );
}

export default function CheckoutModal({ open, onClose, plan, onConfirm, isProcessing }) {
  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-slate-400 text-sm">Checkout</p>
            <h2 className="text-2xl font-bold">{plan.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 p-4 mb-6">
          <p className="text-slate-400 text-sm">Resumo</p>
          <div className="flex items-center justify-between mt-2">
            <span>{plan.description}</span>
            <strong>{formatCurrency(plan.price)}</strong>
          </div>
        </div>

        {plan.checkout ? (
          <div className="space-y-4">
            {!plan.checkout.checkoutUrl && !plan.checkout.qrCode && !plan.checkout.qrCodeBase64 && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-slate-300">
                Integração de pagamento pendente
              </div>
            )}

            {(plan.checkout.status === "PENDING" || plan.checkout.status === "OPEN") && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200">
                Pagamento pendente ({plan.checkout.status})
              </div>
            )}

            {plan.checkout.checkoutUrl && (
              <a
                href={plan.checkout.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3 font-semibold"
              >
                Ir para pagamento
              </a>
            )}

            {plan.checkout.qrCodeBase64 && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <p className="text-slate-400 text-sm mb-3">PIX QR Code</p>
                <img
                  alt="PIX QR Code"
                  className="w-full max-w-xs mx-auto rounded-xl bg-white p-2"
                  src={`data:image/png;base64,${plan.checkout.qrCodeBase64}`}
                />
              </div>
            )}

            {plan.checkout.qrCode && <CopyableField label="Copia e cola (PIX)" value={plan.checkout.qrCode} />}
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.value}
                disabled={isProcessing}
                onClick={() => onConfirm(method.value)}
                className="w-full rounded-2xl border border-slate-800 hover:border-sky-500 bg-slate-950 px-4 py-4 text-left"
              >
                <p className="font-semibold">Pagar com {method.label}</p>
                <p className="text-sm text-slate-500">
                  {method.value === "pix" && "Ideal para um checkout rápido."}
                  {method.value === "card" && "Perfeito para futura recorrência."}
                  {method.value === "boleto" && "Bom para clientes que preferem vencimento."}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
