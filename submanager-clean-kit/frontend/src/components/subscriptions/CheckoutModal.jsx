import { useMemo, useState } from "react";
import { api } from "../../services/api.js";

function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function normalizeDays(plan) {
  const days =
    Number(plan?.days) ||
    Number(plan?.durationDays) ||
    Number(plan?.validityDays) ||
    Number(plan?.metadata?.validityDays) ||
    Number(plan?.metadata?.days) ||
    Number(plan?.metadata?.durationDays) ||
    0;

  return Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
}

function normalizeFeatures(plan) {
  const raw =
    plan?.features ||
    plan?.metadata?.features ||
    plan?.metadata?.items ||
    plan?.metadata?.benefits ||
    [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map(String);
  }

  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }

  return [];
}

export default function CheckoutModal({ plan, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const amountLabel = useMemo(
    () => formatCurrency(plan?.amount, plan?.currency || "BRL"),
    [plan]
  );

  const days = useMemo(() => normalizeDays(plan), [plan]);
  const features = useMemo(() => normalizeFeatures(plan), [plan]);

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
        error?.message || "Não foi possível iniciar o pagamento via PIX."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes checkoutFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes checkoutScaleUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .checkout-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(2, 6, 23, 0.78);
          backdrop-filter: blur(10px);
          animation: checkoutFadeIn 0.22s ease;
        }

        .checkout-modal-card {
          width: 100%;
          max-width: 760px;
          border-radius: 30px;
          border: 1px solid rgba(99,102,241,0.16);
          background: linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%);
          box-shadow: 0 24px 70px rgba(0,0,0,0.42);
          overflow: hidden;
          animation: checkoutScaleUp 0.26s ease;
        }

        .checkout-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 16px;
          border: 1px solid #1f2937;
          background: rgba(255,255,255,0.02);
          padding: 12px 14px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.55;
        }
      `}</style>

      <div className="checkout-modal-backdrop">
        <div className="checkout-modal-card">
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: 24,
              borderBottom: "1px solid rgba(31,41,55,1)",
              background:
                "linear-gradient(135deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 84% 16%, rgba(99,102,241,0.20), transparent 26%)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#c7d2fe",
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.22)",
                    marginBottom: 12,
                  }}
                >
                  Checkout seguro
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#f8fafc",
                    fontSize: 30,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    letterSpacing: -0.5,
                  }}
                >
                  {plan.name}
                </h2>

                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.65,
                    maxWidth: 480,
                  }}
                >
                  Revise os detalhes do plano e finalize o pagamento via PIX.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(31,41,55,1)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e5e7eb",
                  padding: "11px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 24,
              display: "grid",
              gap: 20,
              gridTemplateColumns: "1.1fr 0.9fr",
            }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  borderRadius: 22,
                  border: "1px solid rgba(99,102,241,0.16)",
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  padding: 18,
                }}
              >
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  Valor do plano
                </div>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 34,
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: -0.6,
                  }}
                >
                  {amountLabel}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    Validade
                  </div>
                  <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 800 }}>
                    {days > 0 ? `${days} dias` : "Não informado"}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    Método
                  </div>
                  <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 800 }}>
                    PIX
                  </div>
                </div>
              </div>

              {features.length > 0 ? (
                <div>
                  <div
                    style={{
                      color: "#cbd5e1",
                      fontSize: 13,
                      fontWeight: 800,
                      marginBottom: 12,
                    }}
                  >
                    O que está incluído
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {features.slice(0, 4).map((feature, index) => (
                      <div key={`${feature}-${index}`} className="checkout-feature">
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            marginTop: 6,
                            borderRadius: 999,
                            background: "linear-gradient(135deg, #22c55e 0%, #86efac 100%)",
                            boxShadow: "0 0 12px rgba(34,197,94,0.5)",
                            flex: "0 0 auto",
                          }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.02)",
                padding: 18,
                display: "grid",
                alignContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#f8fafc",
                    fontSize: 18,
                    fontWeight: 900,
                    marginBottom: 8,
                  }}
                >
                  Confirmação do pedido
                </div>

                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  Ao continuar, o sistema vai gerar sua cobrança PIX e redirecionar
                  para a etapa de pagamento.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  color: "#cbd5e1",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(34,197,94,0.16)",
                    background: "rgba(34,197,94,0.06)",
                    padding: "12px 14px",
                  }}
                >
                  Pagamento processado de forma segura via provedor integrado.
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(99,102,241,0.16)",
                    background: "rgba(99,102,241,0.06)",
                    padding: "12px 14px",
                  }}
                >
                  Após a confirmação, sua assinatura será ativada automaticamente.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  style={{
                    width: "100%",
                    borderRadius: 18,
                    padding: "14px 16px",
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#fff",
                    border: "1px solid rgba(99,102,241,0.45)",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%)",
                    boxShadow: "0 12px 28px rgba(79,70,229,0.28)",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Iniciando pagamento..." : "Pagar com PIX"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    width: "100%",
                    borderRadius: 18,
                    padding: "13px 16px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          {message ? (
            <div
              style={{
                padding: "0 24px 22px",
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(99,102,241,0.16)",
                  background: "rgba(99,102,241,0.06)",
                  padding: "14px 16px",
                  color: "#cbd5e1",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}