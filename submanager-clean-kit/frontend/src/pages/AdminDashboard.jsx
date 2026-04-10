import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";
const TOKEN_KEY = "submanager_token";

function formatPrice(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getPlanTitle(plan) {
  return (
    plan?.title ||
    plan?.name ||
    plan?.planName ||
    plan?.label ||
    "Plano sem nome"
  );
}

function getPlanPrice(plan) {
  return plan?.price ?? plan?.amount ?? plan?.value ?? plan?.monthlyPrice ?? 0;
}

function getPlanValidity(plan) {
  return (
    plan?.durationDays ??
    plan?.validityDays ??
    plan?.days ??
    plan?.duration ??
    null
  );
}

function getPlanStock(plan) {
  return (
    plan?.stock ?? plan?.quantity ?? plan?.availableQuantity ?? plan?.limit ?? null
  );
}

function isPlanActive(plan) {
  if (typeof plan?.active === "boolean") return plan.active;
  if (typeof plan?.isActive === "boolean") return plan.isActive;
  if (typeof plan?.enabled === "boolean") return plan.enabled;
  if (typeof plan?.available === "boolean") return plan.available;
  if (typeof plan?.status === "string") {
    const status = plan.status.toLowerCase();
    return ["active", "ativo", "enabled", "available"].includes(status);
  }
  return true;
}

function getCreatedAt(plan) {
  return (
    plan?.createdAt ||
    plan?.created_at ||
    plan?.updatedAt ||
    plan?.updated_at ||
    null
  );
}

function sortNewestPlans(plans) {
  return [...plans].sort((a, b) => {
    const aDate = getCreatedAt(a) ? new Date(getCreatedAt(a)).getTime() : 0;
    const bDate = getCreatedAt(b) ? new Date(getCreatedAt(b)).getTime() : 0;
    return bDate - aDate;
  });
}

function getPaymentsList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.data?.payments)) return data.data.payments;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizePaymentAmount(payment) {
  const value = Number(payment?.amount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function normalizePaymentStatus(payment) {
  return String(payment?.status || "").toUpperCase();
}

function normalizePaymentDate(payment) {
  return (
    payment?.approvedAt ||
    payment?.createdAt ||
    payment?.updatedAt ||
    null
  );
}

function buildRevenueSeries(payments) {
  const grouped = new Map();

  for (const payment of payments) {
    const status = normalizePaymentStatus(payment);
    if (status !== "APPROVED") continue;

    const rawDate = normalizePaymentDate(payment);
    if (!rawDate) continue;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) continue;

    const key = date.toISOString().slice(0, 10);
    const current = grouped.get(key) || 0;
    grouped.set(key, current + normalizePaymentAmount(payment));
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function RevenueChart({ data }) {
  if (!data.length) {
    return (
      <div
        style={{
          height: 260,
          borderRadius: 24,
          border: "1px dashed rgba(34,197,94,0.22)",
          background:
            "linear-gradient(180deg, rgba(34,197,94,0.05) 0%, rgba(11,15,20,0.4) 100%)",
          display: "grid",
          placeItems: "center",
          color: "#9ca3af",
          fontSize: 14,
          textAlign: "center",
          padding: 20,
        }}
      >
        Sem pagamentos aprovados suficientes para exibir o gráfico.
      </div>
    );
  }

  const width = 100;
  const height = 260;
  const padding = 18;
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (data.length - 1);
    const y =
      height -
      padding -
      (item.amount / maxAmount) * (height - padding * 2);

    return { x, y, ...item };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid rgba(34,197,94,0.16)",
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        padding: 18,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 260, display: "block" }}
      >
        <defs>
          <linearGradient id="revenueAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.38)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
          </linearGradient>
          <linearGradient id="revenueLineStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = height - padding - ratio * (height - padding * 2);
          return (
            <line
              key={ratio}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.10)"
              strokeWidth="0.4"
              strokeDasharray="1.6 1.4"
            />
          );
        })}

        <path d={areaPath} fill="url(#revenueAreaFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#revenueLineStroke)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <circle
            key={`${point.date}-${point.amount}`}
            cx={point.x}
            cy={point.y}
            r="1.6"
            fill="#22c55e"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(data.length, 6)}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {data.slice(-6).map((item) => (
          <div
            key={item.date}
            style={{
              minWidth: 0,
              color: "#9ca3af",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {formatShortDate(item.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, accent = "primary" }) {
  const themes = {
    primary: {
      chip: "rgba(99, 102, 241, 0.14)",
      border: "rgba(99, 102, 241, 0.30)",
      glow: "0 0 30px rgba(99, 102, 241, 0.16)",
      dot: "#6366f1",
      value: "#f3f4f6",
    },
    success: {
      chip: "rgba(34, 197, 94, 0.14)",
      border: "rgba(34, 197, 94, 0.30)",
      glow: "0 0 34px rgba(34, 197, 94, 0.16)",
      dot: "#22c55e",
      value: "#86efac",
    },
    danger: {
      chip: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.24)",
      glow: "0 0 30px rgba(239, 68, 68, 0.12)",
      dot: "#ef4444",
      value: "#fca5a5",
    },
    neutral: {
      chip: "rgba(148, 163, 184, 0.10)",
      border: "rgba(148, 163, 184, 0.18)",
      glow: "0 0 24px rgba(148, 163, 184, 0.08)",
      dot: "#94a3b8",
      value: "#f3f4f6",
    },
  };

  const theme = themes[accent] || themes.primary;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 20,
        boxShadow: theme.glow,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: theme.chip,
          color: "#cbd5e1",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: theme.dot,
            boxShadow: `0 0 12px ${theme.dot}`,
          }}
        />
        {title}
      </div>

      <div
        style={{
          color: theme.value,
          fontSize: 32,
          lineHeight: 1.05,
          fontWeight: 900,
          marginBottom: 8,
        }}
      >
        {value}
      </div>

      <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.55 }}>
        {hint}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        border: "1px solid #1f2937",
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              color: "#f3f4f6",
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p style={{ margin: "8px 0 0", color: "#9ca3af", fontSize: 14 }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      {children}
    </section>
  );
}

function ActionButton({ children, onClick, variant = "secondary" }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      color: "#ffffff",
      border: "1px solid rgba(99, 102, 241, 0.65)",
      boxShadow: "0 0 30px rgba(99,102,241,0.28)",
    },
    secondary: {
      background: "rgba(99, 102, 241, 0.08)",
      color: "#e5e7eb",
      border: "1px solid rgba(99, 102, 241, 0.18)",
      boxShadow: "none",
    },
  };

  const current = styles[variant] || styles.secondary;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
      style={{
        ...current,
        borderRadius: 16,
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, description, buttonLabel, onClick }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(99, 102, 241, 0.22)",
        borderRadius: 24,
        padding: 28,
        textAlign: "center",
        background:
          "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(11,15,20,0.4) 100%)",
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          margin: "0 auto 14px",
          background: "rgba(99, 102, 241, 0.12)",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          color: "#c7d2fe",
          boxShadow: "0 0 30px rgba(99,102,241,0.18)",
        }}
      >
        ✦
      </div>

      <h3 style={{ margin: 0, color: "#f3f4f6", fontSize: 18, fontWeight: 900 }}>
        {title}
      </h3>

      <p
        style={{
          margin: "10px auto 18px",
          maxWidth: 480,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {buttonLabel ? (
        <ActionButton onClick={onClick} variant="primary">
          {buttonLabel}
        </ActionButton>
      ) : null}
    </div>
  );
}

function PlanRow({ plan }) {
  const title = getPlanTitle(plan);
  const price = getPlanPrice(plan);
  const validity = getPlanValidity(plan);
  const stock = getPlanStock(plan);
  const active = isPlanActive(plan);

  return (
    <div
      className="admin-dashboard-plan-row"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) 0.9fr 0.8fr 0.8fr auto",
        gap: 14,
        alignItems: "center",
        padding: "16px 18px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid #1f2937",
        borderRadius: 20,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          title={title}
          style={{
            color: "#f3f4f6",
            fontWeight: 800,
            fontSize: 15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            color: active ? "#86efac" : "#fca5a5",
            background: active
              ? "rgba(34,197,94,0.10)"
              : "rgba(239,68,68,0.10)",
            border: active
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: active ? "#22c55e" : "#ef4444",
              boxShadow: active
                ? "0 0 12px rgba(34,197,94,0.8)"
                : "0 0 12px rgba(239,68,68,0.8)",
            }}
          />
          {active ? "Ativo" : "Inativo"}
        </div>
      </div>

      <div style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 14 }}>
        {formatPrice(price)}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: 14 }}>
        {validity ? `${validity} dias` : "—"}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: 14 }}>
        {stock !== null && stock !== undefined ? stock : "—"}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: 12,
          fontWeight: 800,
          textAlign: "right",
        }}
      >
        Plano
      </div>
    </div>
  );
}

function MiniPlanCard({ plan }) {
  const title = getPlanTitle(plan);
  const price = formatPrice(getPlanPrice(plan));
  const validity = getPlanValidity(plan);
  const active = isPlanActive(plan);

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <strong style={{ color: "#f3f4f6", fontSize: 14, lineHeight: 1.4 }}>
          {title}
        </strong>

        <span
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            color: active ? "#86efac" : "#fca5a5",
            background: active
              ? "rgba(34,197,94,0.10)"
              : "rgba(239,68,68,0.10)",
            border: active
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(239,68,68,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {active ? "ATIVO" : "INATIVO"}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          color: "#cbd5e1",
          fontSize: 13,
          display: "grid",
          gap: 6,
        }}
      >
        <span>Preço: {price}</span>
        <span>Validade: {validity ? `${validity} dias` : "—"}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        setLoadingPlans(true);
        setPlansError("");

        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/plans`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao buscar planos (${response.status})`);
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.plans)
          ? data.plans
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mounted) setPlans(normalized);
      } catch (error) {
        if (mounted) {
          setPlans([]);
          setPlansError(error?.message || "Não foi possível carregar os planos.");
        }
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    }

    async function loadPayments() {
      try {
        setLoadingPayments(true);
        setPaymentsError("");

        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/payments/me`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao buscar pagamentos (${response.status})`);
        }

        const data = await response.json();
        const normalized = getPaymentsList(data);

        if (mounted) setPayments(normalized);
      } catch (error) {
        if (mounted) {
          setPayments([]);
          setPaymentsError(error?.message || "Não foi possível carregar os pagamentos.");
        }
      } finally {
        if (mounted) setLoadingPayments(false);
      }
    }

    loadPlans();
    loadPayments();

    return () => {
      mounted = false;
    };
  }, []);

  const planStats = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((plan) => isPlanActive(plan)).length;
    const inactivePlans = totalPlans - activePlans;
    const totalStock = plans.reduce((acc, plan) => {
      const stock = Number(getPlanStock(plan));
      return acc + (Number.isFinite(stock) ? stock : 0);
    }, 0);

    return { totalPlans, activePlans, inactivePlans, totalStock };
  }, [plans]);

  const paymentStats = useMemo(() => {
    const approved = payments.filter(
      (payment) => normalizePaymentStatus(payment) === "APPROVED"
    );
    const pending = payments.filter(
      (payment) => normalizePaymentStatus(payment) === "PENDING"
    );
    const rejectedOrCancelled = payments.filter((payment) =>
      ["REJECTED", "CANCELLED", "EXPIRED"].includes(
        normalizePaymentStatus(payment)
      )
    );

    const totalRevenue = approved.reduce(
      (acc, payment) => acc + normalizePaymentAmount(payment),
      0
    );

    return {
      totalRevenue,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejectedOrCancelled.length,
    };
  }, [payments]);

  const latestPlans = useMemo(() => sortNewestPlans(plans).slice(0, 4), [plans]);
  const revenueSeries = useMemo(() => buildRevenueSeries(payments), [payments]);

  const loadingAny = loadingPlans || loadingPayments;

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.10) 0%, rgba(11,15,20,0) 32%), #0b0f14",
        padding: 24,
      }}
    >
      <style>{`
        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.95fr;
          gap: 20px;
        }

        .admin-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-dashboard-finance-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 20px;
        }

        .admin-dashboard-quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        @media (max-width: 1180px) {
          .admin-dashboard-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-dashboard-grid,
          .admin-dashboard-finance-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .admin-dashboard-quick-actions {
            grid-template-columns: 1fr;
          }

          .admin-dashboard-plan-row {
            grid-template-columns: 1fr;
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          .admin-dashboard-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: 30,
            padding: 28,
            boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 85% 15%, rgba(99,102,241,0.22), transparent 24%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(99,102,241,0.10)",
                  border: "1px solid rgba(99,102,241,0.18)",
                  color: "#c7d2fe",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6366f1",
                    boxShadow: "0 0 16px rgba(99,102,241,0.95)",
                  }}
                />
                visão geral
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#f3f4f6",
                  fontSize: 36,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                }}
              >
                Admin Dashboard
              </h1>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#9ca3af",
                  fontSize: 15,
                  maxWidth: 700,
                  lineHeight: 1.65,
                }}
              >
                Painel administrativo com visão de planos, pagamentos e lucro.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ActionButton variant="secondary" onClick={() => window.location.reload()}>
                Atualizar painel
              </ActionButton>

              <ActionButton variant="primary" onClick={() => navigate("/plans")}>
                Ver planos
              </ActionButton>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-stats">
          <StatCard
            title="Valor lucrado"
            value={loadingPayments ? "..." : formatPrice(paymentStats.totalRevenue)}
            hint="Total confirmado em pagamentos aprovados."
            accent="success"
          />
          <StatCard
            title="Pagamentos aprovados"
            value={loadingPayments ? "..." : paymentStats.approvedCount}
            hint="Quantidade de pagamentos com status aprovado."
            accent="primary"
          />
          <StatCard
            title="Pendentes"
            value={loadingPayments ? "..." : paymentStats.pendingCount}
            hint="Pagamentos aguardando confirmação."
            accent="neutral"
          />
          <StatCard
            title="Planos ativos"
            value={loadingPlans ? "..." : planStats.activePlans}
            hint="Planos disponíveis no momento."
            accent="success"
          />
        </div>

        <div className="admin-dashboard-finance-grid">
          <SectionCard
            title="Gráfico de lucro"
            subtitle="Evolução dinâmica dos pagamentos aprovados por data."
          >
            {loadingPayments ? (
              <div
                style={{
                  height: 260,
                  borderRadius: 24,
                  border: "1px solid #1f2937",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
                  backgroundSize: "400% 100%",
                  animation: "pulse 1.8s ease infinite",
                }}
              />
            ) : paymentsError ? (
              <EmptyState
                title="Falha ao carregar lucro"
                description={paymentsError}
                buttonLabel="Tentar novamente"
                onClick={() => window.location.reload()}
              />
            ) : (
              <RevenueChart data={revenueSeries} />
            )}
          </SectionCard>

          <SectionCard
            title="Resumo financeiro"
            subtitle="Indicadores rápidos do fluxo de pagamentos."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  borderRadius: 22,
                  border: "1px solid rgba(34,197,94,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(34,197,94,0.08) 0%, rgba(11,15,20,0.65) 100%)",
                  padding: 18,
                }}
              >
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  Lucro total
                </div>

                <div
                  style={{
                    color: "#86efac",
                    fontSize: 34,
                    lineHeight: 1.05,
                    fontWeight: 900,
                    textShadow: "0 0 18px rgba(34,197,94,0.22)",
                  }}
                >
                  {loadingPayments ? "..." : formatPrice(paymentStats.totalRevenue)}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Valor confirmado e já consolidado no painel.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    padding: 16,
                  }}
                >
                  <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 800 }}>
                    Rejeitados / cancelados
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      color: "#fca5a5",
                      fontSize: 24,
                      fontWeight: 900,
                    }}
                  >
                    {loadingPayments ? "..." : paymentStats.rejectedCount}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 20,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.02)",
                    padding: 16,
                  }}
                >
                  <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 800 }}>
                    Total de planos
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      color: "#f3f4f6",
                      fontSize: 24,
                      fontWeight: 900,
                    }}
                  >
                    {loadingPlans ? "..." : planStats.totalPlans}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="admin-dashboard-grid">
          <SectionCard
            title="Planos disponíveis"
            subtitle="Lista com os planos reais recebidos da API."
            action={
              <ActionButton variant="secondary" onClick={() => navigate("/plans")}>
                Gerenciar planos
              </ActionButton>
            }
          >
            {loadingPlans ? (
              <div style={{ display: "grid", gap: 12 }}>
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    style={{
                      height: 86,
                      borderRadius: 20,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
                      backgroundSize: "400% 100%",
                      animation: "pulse 1.8s ease infinite",
                      border: "1px solid rgba(31,41,55,1)",
                    }}
                  />
                ))}
              </div>
            ) : plansError ? (
              <EmptyState
                title="Falha ao carregar planos"
                description={plansError}
                buttonLabel="Tentar novamente"
                onClick={() => window.location.reload()}
              />
            ) : plans.length === 0 ? (
              <EmptyState
                title="Nenhum plano cadastrado"
                description="Não há planos para exibir no momento."
                buttonLabel="Atualizar"
                onClick={() => window.location.reload()}
              />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {sortNewestPlans(plans).map((plan, index) => (
                  <PlanRow key={plan?.id || `${getPlanTitle(plan)}-${index}`} plan={plan} />
                ))}
              </div>
            )}
          </SectionCard>

          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            <SectionCard
              title="Planos recentes"
              subtitle="Últimos itens retornados pela API."
            >
              {loadingPlans ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      style={{
                        height: 92,
                        borderRadius: 20,
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
                        backgroundSize: "400% 100%",
                        animation: "pulse 1.8s ease infinite",
                        border: "1px solid rgba(31,41,55,1)",
                      }}
                    />
                  ))}
                </div>
              ) : latestPlans.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6 }}>
                  Sem planos recentes para mostrar.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {latestPlans.map((plan, index) => (
                    <MiniPlanCard
                      key={plan?.id || `${getPlanTitle(plan)}-mini-${index}`}
                      plan={plan}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Ações rápidas" subtitle="Atalhos para o fluxo principal.">
              <div className="admin-dashboard-quick-actions">
                <ActionButton variant="primary" onClick={() => navigate("/plans")}>
                  Ver planos
                </ActionButton>

                <ActionButton variant="secondary" onClick={() => navigate("/admin/subscribers")}>
                  Usuários
                </ActionButton>

                <ActionButton variant="secondary" onClick={() => window.location.reload()}>
                  Atualizar dados
                </ActionButton>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}