import { useMemo, useState } from "react";
import CheckoutModal from "./CheckoutModal.jsx";

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

function getBadge(plan) {
  return (
    plan?.badge ||
    plan?.metadata?.badge ||
    (plan?.metadata?.highlight ? "Destaque" : "")
  );
}

function getHighlight(plan) {
  return Boolean(
    plan?.highlight ||
      plan?.isHighlighted ||
      plan?.featured ||
      plan?.metadata?.highlight ||
      plan?.metadata?.featured
  );
}

function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

export function PlanCard({ plan, user, showCheckout = true }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isActive = plan?.isActive !== false;
  const days = normalizeDays(plan);
  const features = normalizeFeatures(plan);
  const stock = normalizeStock(plan);
  const originalAmount = normalizeOriginalAmount(plan);
  const badge = getBadge(plan);
  const highlight = getHighlight(plan);

  const formattedPrice = useMemo(
    () => formatCurrency(plan?.amount || 0, plan?.currency || "BRL"),
    [plan]
  );

  const formattedOriginalPrice = useMemo(
    () => formatCurrency(originalAmount, plan?.currency || "BRL"),
    [originalAmount, plan]
  );

  return (
    <>
      <style>{`
        @keyframes planCardFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .plan-card-root {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 22px;
          border: 1px solid rgba(31, 41, 55, 1);
          background: linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%);
          box-shadow: 0 16px 44px rgba(0,0,0,0.22);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          animation: planCardFadeUp 0.45s ease both;
        }

        .plan-card-root:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 56px rgba(0,0,0,0.28);
          border-color: rgba(99,102,241,0.28);
        }

        .plan-card-root.plan-card-highlight {
          border-color: rgba(99,102,241,0.24);
          box-shadow:
            0 16px 44px rgba(0,0,0,0.22),
            0 0 0 1px rgba(99,102,241,0.08),
            0 0 40px rgba(99,102,241,0.12);
        }

        .plan-card-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 88% 12%, rgba(99,102,241,0.18), transparent 26%),
            radial-gradient(circle at 0% 100%, rgba(34,197,94,0.08), transparent 24%);
        }

        .plan-card-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid #1f2937;
          background: rgba(255,255,255,0.02);
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.55;
        }

        .plan-card-feature-dot {
          width: 8px;
          height: 8px;
          margin-top: 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, #22c55e 0%, #86efac 100%);
          box-shadow: 0 0 12px rgba(34,197,94,0.5);
          flex: 0 0 auto;
        }

        .plan-card-action {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 18px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          border: 1px solid rgba(99,102,241,0.45);
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%);
          box-shadow: 0 10px 28px rgba(79,70,229,0.28);
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
        }

        .plan-card-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(79,70,229,0.34);
        }

        .plan-card-action:active {
          transform: translateY(0);
        }
      `}</style>

      <div className={`plan-card-root ${highlight ? "plan-card-highlight" : ""}`}>
        <div className="plan-card-glow" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {badge ? (
                  <span
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
                    }}
                  >
                    {badge}
                  </span>
                ) : null}

                {highlight ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#86efac",
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.18)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 12px rgba(34,197,94,0.8)",
                      }}
                    />
                    Recomendado
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  color: "#f8fafc",
                  fontSize: 22,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: -0.4,
                }}
              >
                {plan?.name || "Plano"}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                {plan?.description || "Acesso simples e direto."}
              </div>
            </div>

            <div
              style={{
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isActive ? "#86efac" : "#cbd5e1",
                background: isActive
                  ? "rgba(34,197,94,0.10)"
                  : "rgba(148,163,184,0.10)",
                border: isActive
                  ? "1px solid rgba(34,197,94,0.18)"
                  : "1px solid rgba(148,163,184,0.18)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isActive ? "#22c55e" : "#94a3b8",
                  boxShadow: isActive
                    ? "0 0 12px rgba(34,197,94,0.72)"
                    : "0 0 10px rgba(148,163,184,0.42)",
                }}
              />
              {isActive ? "Disponível" : "Indisponível"}
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 22,
              border: "1px solid rgba(99,102,241,0.16)",
              background:
                "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            <div
              style={{
                color: "#9ca3af",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Investimento
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {originalAmount > 0 ? (
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "line-through",
                  }}
                >
                  {formattedOriginalPrice}
                </span>
              ) : null}

              <span
                style={{
                  color: "#ffffff",
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: -0.6,
                }}
              >
                {formattedPrice}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                Estoque
              </div>
              <div style={{ color: "#f8fafc", fontSize: 15, fontWeight: 800 }}>
                {stock > 0 ? `${stock} unidades` : "Sem limite"}
              </div>
            </div>
          </div>

          {features.length > 0 ? (
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Benefícios do plano
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {features.slice(0, 5).map((feature, index) => (
                  <div key={`${feature}-${index}`} className="plan-card-feature">
                    <span className="plan-card-feature-dot" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showCheckout && isActive ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="plan-card-action"
              style={{ marginTop: 20 }}
            >
              {user?.role === "ADMIN" ? "Gerenciar plano" : "Assinar agora"}
            </button>
          ) : null}
        </div>
      </div>

      <CheckoutModal
        plan={plan}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}