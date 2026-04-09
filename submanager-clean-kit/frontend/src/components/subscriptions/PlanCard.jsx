
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

export function PlanCard({ plan, user, showCheckout = true }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isActive = plan?.isActive !== false;
  const days = normalizeDays(plan);
  const features = normalizeFeatures(plan);
  const stock = normalizeStock(plan);
  const originalAmount = normalizeOriginalAmount(plan);

  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: plan?.currency || "BRL",
  }).format(Number(plan?.amount || 0));

  return (
    <>
      <div
        style={{
          borderRadius: 28,
          border: "1px solid #1f2937",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          padding: 22,
          boxShadow: "0 14px 32px rgba(0,0,0,0.20)",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#f3f4f6",
                lineHeight: 1.2,
              }}
            >
              {plan?.name || "Plano"}
            </p>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                color: "#9ca3af",
                lineHeight: 1.65,
              }}
            >
              {plan?.description || "Acesso simples e direto."}
            </p>
          </div>

          <span
            style={{
              flex: "0 0 auto",
              borderRadius: 999,
              padding: "6px 11px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: isActive ? "#86efac" : "#9ca3af",
              background: isActive
                ? "rgba(34,197,94,0.10)"
                : "rgba(148,163,184,0.10)",
              border: isActive
                ? "1px solid rgba(34,197,94,0.18)"
                : "1px solid rgba(148,163,184,0.18)",
            }}
          >
            {isActive ? "Disponível" : "Indisponível"}
          </span>
        </div>

        <div
          style={{
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

          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {originalAmount > 0 ? (
              <span
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textDecoration: "line-through",
                }}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: plan?.currency || "BRL",
                }).format(originalAmount)}
              </span>
            ) : null}

            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: "#f3f4f6",
                lineHeight: 1,
              }}
            >
              {amountFormatted}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              borderRadius: 18,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 16px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#9ca3af",
              }}
            >
              Validade
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#f3f4f6",
              }}
            >
              {days > 0 ? `${days} dias` : "Não informado"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              borderRadius: 18,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 16px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#9ca3af",
              }}
            >
              Estoque
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#f3f4f6",
              }}
            >
              {stock > 0 ? `${stock} unidades` : "Sem limite definido"}
            </span>
          </div>
        </div>

        {features.length > 0 ? (
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#9ca3af",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}
            >
              Benefícios
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "12px 0 0",
                display: "grid",
                gap: 10,
              }}
            >
              {features.slice(0, 5).map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    borderRadius: 18,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    padding: "14px 16px",
                    color: "#d1d5db",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      marginTop: 7,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#6366f1",
                      boxShadow: "0 0 12px rgba(99,102,241,0.75)",
                      flex: "0 0 auto",
                    }}
                  />
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
            style={{
              height: 52,
              width: "100%",
              borderRadius: 18,
              border: "1px solid rgba(99,102,241,0.55)",
              background:
                "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(99,102,241,0.22)",
            }}
          >
            {user?.role === "ADMIN" ? "Gerenciar" : "Assinar plano"}
          </button>
        ) : null}
      </div>

      <CheckoutModal
        plan={plan}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}