
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
      const response = await api.post("/checkout/create", {
        planId: plan.id,
        paymentMethod: "PIX",
      });

      const checkoutUrl =
        response?.checkoutUrl ||
        response?.url ||
        response?.data?.checkoutUrl ||
        response?.data?.url;

      const qrCode = response?.qrCode || response?.data?.qrCode;
      const qrCodeBase64 =
        response?.qrCodeBase64 || response?.data?.qrCodeBase64;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      if (typeof onSuccess === "function") {
        onSuccess({ ...response, qrCode, qrCodeBase64 });
      }

      setMessage("Pagamento via PIX iniciado com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento via PIX."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "rgba(2,6,23,0.80)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 30,
          border: "1px solid #1f2937",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          padding: 24,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#9ca3af",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}
            >
              Pagamento via PIX
            </p>

            <h2
              style={{
                margin: "8px 0 0",
                fontSize: 28,
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#f3f4f6",
              }}
            >
              {plan.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              height: 42,
              padding: "0 14px",
              borderRadius: 14,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.03)",
              color: "#e5e7eb",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            borderRadius: 22,
            border: "1px solid #1f2937",
            background: "rgba(255,255,255,0.03)",
            padding: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#9ca3af",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            Preço
          </p>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 34,
              fontWeight: 900,
              color: "#f3f4f6",
              lineHeight: 1.05,
            }}
          >
            {amountLabel}
          </p>
        </div>

        <div
          style={{
            marginTop: 14,
            borderRadius: 22,
            border: "1px solid #1f2937",
            background: "rgba(255,255,255,0.03)",
            padding: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#9ca3af",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            Método disponível
          </p>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 20,
              fontWeight: 800,
              color: "#f3f4f6",
            }}
          >
            PIX
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          style={{
            marginTop: 20,
            height: 52,
            width: "100%",
            borderRadius: 18,
            border: "1px solid rgba(99,102,241,0.55)",
            background:
              "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 0 30px rgba(99,102,241,0.22)",
          }}
        >
          {loading ? "Iniciando..." : "Pagar com PIX"}
        </button>

        {message ? (
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              color: "#9ca3af",
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}