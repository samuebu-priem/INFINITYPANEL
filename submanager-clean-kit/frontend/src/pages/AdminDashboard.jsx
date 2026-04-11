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
    plan?.metadata?.validityDays ??
    plan?.metadata?.days ??
    null
  );
}

function getPlanStock(plan) {
  return (
    plan?.stock ??
    plan?.quantity ??
    plan?.availableQuantity ??
    plan?.limit ??
    null
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
  return payment?.approvedAt || payment?.createdAt || null;
}

function buildRevenueSeries(payments) {
  const grouped = new Map();

  for (const payment of payments) {
    if (normalizePaymentStatus(payment) !== "APPROVED") continue;

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

function SectionCard({ title, subtitle, children }) {
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
      <div style={{ marginBottom: 18 }}>
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

      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/plans`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.plans)
          ? data.plans
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mounted) setPlans(normalized);
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    }

    async function loadPayments() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/payments/me`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        if (mounted) setPayments(getPaymentsList(data));
      } finally {
        if (mounted) setLoadingPayments(false);
      }
    }

    async function loadAll() {
      await Promise.all([loadPlans(), loadPayments()]);
    }

    loadAll();
    const interval = window.setInterval(loadAll, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const totalRevenue = useMemo(() => {
    return payments
      .filter((payment) => normalizePaymentStatus(payment) === "APPROVED")
      .reduce((acc, payment) => acc + normalizePaymentAmount(payment), 0);
  }, [payments]);

  const approvedCount = useMemo(() => {
    return payments.filter(
      (payment) => normalizePaymentStatus(payment) === "APPROVED"
    ).length;
  }, [payments]);

  const activePlans = useMemo(() => {
    return plans.filter((plan) => isPlanActive(plan)).length;
  }, [plans]);

  const revenueSeries = useMemo(() => buildRevenueSeries(payments), [payments]);

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
        .admin-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }

        @media (max-width: 1180px) {
          .admin-dashboard-stats,
          .admin-dashboard-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 860px) {
          .admin-dashboard-stats,
          .admin-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gap: 20 }}>
        <section
          style={{
            borderRadius: 30,
            padding: 28,
            border: "1px solid rgba(99, 102, 241, 0.18)",
            background:
              "linear-gradient(135deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color: "#f3f4f6",
                  fontSize: 36,
                  lineHeight: 1.05,
                  fontWeight: 900,
                }}
              >
                Admin Dashboard
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#9ca3af",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                Visão geral de lucro, pagamentos e planos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/subscribers")}
              style={{
                borderRadius: 16,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                border: "1px solid rgba(99,102,241,0.45)",
                background:
                  "linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%)",
                cursor: "pointer",
              }}
            >
              Usuários
            </button>
          </div>
        </section>

        <div className="admin-dashboard-stats">
          <StatCard
            title="Valor lucrado"
            value={loadingPayments ? "..." : formatPrice(totalRevenue)}
            hint="Total consolidado em pagamentos aprovados."
            accent="success"
          />
          <StatCard
            title="Aprovados"
            value={loadingPayments ? "..." : approvedCount}
            hint="Pagamentos confirmados."
            accent="primary"
          />
          <StatCard
            title="Planos ativos"
            value={loadingPlans ? "..." : activePlans}
            hint="Planos disponíveis."
            accent="neutral"
          />
          <StatCard
            title="Planos totais"
            value={loadingPlans ? "..." : plans.length}
            hint="Todos os planos cadastrados."
            accent="primary"
          />
        </div>

        <div className="admin-dashboard-grid">
          <SectionCard
            title="Gráfico de lucro"
            subtitle="Pagamentos aprovados por data."
          >
            {loadingPayments ? (
              <div style={{ color: "#9ca3af" }}>Carregando gráfico...</div>
            ) : (
              <RevenueChart data={revenueSeries} />
            )}
          </SectionCard>

          <SectionCard
            title="Resumo"
            subtitle="Indicadores rápidos do painel."
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
                  {loadingPayments ? "..." : formatPrice(totalRevenue)}
                </div>
              </div>

              <div style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6 }}>
                O gráfico e o valor acima atualizam automaticamente conforme novas
                assinaturas forem aprovadas.
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}