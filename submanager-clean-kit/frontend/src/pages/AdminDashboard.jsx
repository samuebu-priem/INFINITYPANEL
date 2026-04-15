import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const API_BASE = "/api";
const TOKEN_KEY = "submanager_token";

function formatPrice(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getPaymentsList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.data?.payments)) return data.data.payments;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getSupervisorRecordsList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data?.records)) return data.data.records;
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

function normalizeSupervisorRevenue(record) {
  const value = Number(record?.mediatorRevenue ?? 0);
  return Number.isFinite(value) ? value : 0;
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
    .map(([date, amount]) => ({
      date,
      amount,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
}

function buildSupervisorRevenueSeries(records) {
  const grouped = new Map();

  for (const record of records) {
    const rawDate = record?.createdAt;
    if (!rawDate) continue;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) continue;

    const key = date.toISOString().slice(0, 10);
    const current = grouped.get(key) || 0;
    grouped.set(key, current + normalizeSupervisorRevenue(record));
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({
      date,
      amount,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: "#86efac", fontSize: 14, fontWeight: 800 }}>
        {formatPrice(payload[0].value)}
      </div>
    </div>
  );
}

function LatestSupervisorRecord({ record }) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 18,
        background: "rgba(255,255,255,0.02)",
        padding: 16,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ color: "#f3f4f6", fontSize: 15, fontWeight: 800 }}>
        {record?.threadName || "Thread não informada"}
      </div>

      <div style={{ color: "#9ca3af", fontSize: 13 }}>
        Mediador:{" "}
        <strong style={{ color: "#e5e7eb" }}>
          {record?.mediatorName || "Não informado"}
        </strong>
      </div>

      <div style={{ color: "#9ca3af", fontSize: 13 }}>
        Modalidade:{" "}
        <strong style={{ color: "#e5e7eb" }}>
          {record?.mode || "Não informada"}
        </strong>
      </div>

      <div style={{ color: "#9ca3af", fontSize: 13 }}>
        Vencedor:{" "}
        <strong style={{ color: "#e5e7eb" }}>
          {record?.winner || "Não informado"}
        </strong>
      </div>

      <div style={{ color: "#86efac", fontSize: 14, fontWeight: 800 }}>
        Lucro: {formatPrice(record?.mediatorRevenue)}
      </div>

      <div style={{ color: "#6b7280", fontSize: 12 }}>
        {record?.createdAt
          ? new Date(record.createdAt).toLocaleString("pt-BR")
          : "Sem data"}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [supervisorRecords, setSupervisorRecords] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSupervisorRecords, setLoadingSupervisorRecords] = useState(true);

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

    async function loadSupervisorRecords() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/internal/matches/records`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        if (mounted) setSupervisorRecords(getSupervisorRecordsList(data));
      } finally {
        if (mounted) setLoadingSupervisorRecords(false);
      }
    }

    async function loadAll() {
      await Promise.all([
        loadPlans(),
        loadPayments(),
        loadSupervisorRecords(),
      ]);
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
    return plans.filter((plan) => {
      if (typeof plan?.isActive === "boolean") return plan.isActive;
      if (typeof plan?.active === "boolean") return plan.active;
      return true;
    }).length;
  }, [plans]);

  const revenueSeries = useMemo(() => buildRevenueSeries(payments), [payments]);

  const supervisorMatchesCount = useMemo(() => {
    return supervisorRecords.length;
  }, [supervisorRecords]);

  const supervisorTotalRevenue = useMemo(() => {
    return supervisorRecords.reduce(
      (acc, record) => acc + normalizeSupervisorRevenue(record),
      0
    );
  }, [supervisorRecords]);

  const supervisorRevenueSeries = useMemo(() => {
    return buildSupervisorRevenueSeries(supervisorRecords);
  }, [supervisorRecords]);

  const latestSupervisorRecords = useMemo(() => {
    return supervisorRecords.slice(0, 6);
  }, [supervisorRecords]);

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

        .admin-dashboard-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .admin-dashboard-records-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .admin-dashboard-stats,
          .admin-dashboard-grid,
          .admin-dashboard-bottom-grid,
          .admin-dashboard-records-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 860px) {
          .admin-dashboard-stats,
          .admin-dashboard-grid,
          .admin-dashboard-bottom-grid,
          .admin-dashboard-records-grid {
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
                Visão geral financeira e operacional do painel.
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
            hint="Pagamentos aprovados do sistema."
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
            title="Lucro supervisor"
            value={
              loadingSupervisorRecords
                ? "..."
                : formatPrice(supervisorTotalRevenue)
            }
            hint="Lucro operacional vindo do bot supervisor."
            accent="success"
          />
        </div>

        <div className="admin-dashboard-grid">
          <SectionCard
            title="Gráfico de pagamentos"
            subtitle="Pagamentos aprovados por data."
          >
            {loadingPayments ? (
              <div style={{ color: "#9ca3af" }}>Carregando gráfico...</div>
            ) : revenueSeries.length === 0 ? (
              <div style={{ color: "#9ca3af" }}>
                Sem pagamentos aprovados suficientes para exibir o gráfico.
              </div>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Resumo financeiro"
            subtitle="Indicadores rápidos do sistema."
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
                  Lucro total do sistema
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
                Esses valores são baseados nos pagamentos confirmados e nos
                registros operacionais recebidos do supervisor.
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="admin-dashboard-bottom-grid">
          <SectionCard
            title="Gráfico do supervisor"
            subtitle="Lucro operacional registrado pelo bot supervisor."
          >
            {loadingSupervisorRecords ? (
              <div style={{ color: "#9ca3af" }}>Carregando gráfico...</div>
            ) : supervisorRevenueSeries.length === 0 ? (
              <div style={{ color: "#9ca3af" }}>
                Nenhum registro operacional suficiente para exibir o gráfico.
              </div>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={supervisorRevenueSeries}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#818cf8"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Resumo operacional"
            subtitle="Visão geral do que o supervisor está registrando."
          >
            <div className="admin-dashboard-stats" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <StatCard
                title="Partidas supervisor"
                value={loadingSupervisorRecords ? "..." : supervisorMatchesCount}
                hint="Registros enviados pelo bot."
                accent="primary"
              />
              <StatCard
                title="Lucro operacional"
                value={
                  loadingSupervisorRecords
                    ? "..."
                    : formatPrice(supervisorTotalRevenue)
                }
                hint="Receita de mediação acumulada."
                accent="success"
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Últimos registros do supervisor"
          subtitle="Últimas partidas contabilizadas e recebidas pelo backend."
        >
          {loadingSupervisorRecords ? (
            <div style={{ color: "#9ca3af" }}>Carregando registros...</div>
          ) : latestSupervisorRecords.length === 0 ? (
            <div style={{ color: "#9ca3af" }}>
              Nenhum registro operacional encontrado.
            </div>
          ) : (
            <div className="admin-dashboard-records-grid">
              {latestSupervisorRecords.map((record) => (
                <LatestSupervisorRecord key={record.id} record={record} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}