import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { UserHomeFooter } from "../components/layout/UserHomeFooter.jsx";

function getPlansList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.plans)) return response.plans;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function isPlanActive(plan) {
  if (typeof plan?.active === "boolean") return plan.active;
  if (typeof plan?.isActive === "boolean") return plan.isActive;
  if (typeof plan?.enabled === "boolean") return plan.enabled;
  if (typeof plan?.available === "boolean") return plan.available;
  return true;
}

function getSubscriptionsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subscriptions)) return response.subscriptions;
  if (Array.isArray(response?.data?.subscriptions)) {
    return response.data.subscriptions;
  }
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getPlanName(subscription) {
  return (
    subscription?.plan?.name ||
    subscription?.plan?.title ||
    subscription?.planName ||
    subscription?.plan?.label ||
    "Plano ativo"
  );
}

function getSubscriptionEndsAt(subscription) {
  return (
    subscription?.endsAt ||
    subscription?.expiresAt ||
    subscription?.validUntil ||
    subscription?.endDate ||
    null
  );
}

function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (subscription?.isActive === true) return true;

  const status = String(subscription?.status || "").toUpperCase();
  if (status !== "ACTIVE") return false;

  const endsAt = getSubscriptionEndsAt(subscription);
  if (!endsAt) return false;

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() > Date.now();
}

function buildCountdown(endsAt, nowTs) {
  if (!endsAt) {
    return {
      expired: true,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Expirada",
    };
  }

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) {
    return {
      expired: true,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Expirada",
    };
  }

  const diffMs = endDate.getTime() - nowTs;

  if (diffMs <= 0) {
    return {
      expired: true,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Expirada",
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    totalMs: diffMs,
    days,
    hours,
    minutes,
    seconds,
    label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  };
}

function SectionCard({ title, subtitle, children, action, flush = false }) {
  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        border: "1px solid rgba(99,102,241,0.16)",
        borderRadius: 30,
        padding: 24,
        boxShadow: "0 14px 44px rgba(0,0,0,0.24)",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = "0 22px 60px rgba(0,0,0,0.30)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.28)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 14px 44px rgba(0,0,0,0.24)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.16)";
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: flush ? 14 : 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            {title ? (
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#f3f4f6",
                  letterSpacing: "-0.03em",
                }}
              >
                {title}
              </h2>
            ) : null}

            {subtitle ? (
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      )}

      {children}
    </section>
  );
}

function StatCard({ label, value, helpText, accent = "primary", highlight = false }) {
  const accents = {
    primary: {
      value: "#f3f4f6",
      border: "rgba(99,102,241,0.16)",
      bg: "rgba(255,255,255,0.02)",
      glow: "rgba(99,102,241,0.10)",
    },
    success: {
      value: "#86efac",
      border: "rgba(34,197,94,0.18)",
      bg: "rgba(34,197,94,0.05)",
      glow: "rgba(34,197,94,0.10)",
    },
  };

  const theme = accents[accent] || accents.primary;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        background: theme.bg,
        padding: 20,
        minHeight: 152,
        boxShadow: highlight ? `0 18px 40px ${theme.glow}` : "none",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = `0 22px 50px ${theme.glow}`;
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.26)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = highlight ? `0 18px 40px ${theme.glow}` : "none";
        event.currentTarget.style.borderColor = theme.border;
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(99,102,241,0.06), transparent 38%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: theme.value,
          fontSize: 36,
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 8,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {helpText}
      </div>
    </div>
  );
}

function EmptyState({ title, description, hint }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.18)",
        borderRadius: 28,
        padding: 34,
        textAlign: "center",
        background:
          "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(11,15,20,0.42) 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 42%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: 66,
          height: 66,
          borderRadius: 22,
          margin: "0 auto 16px",
          background: "rgba(99, 102, 241, 0.14)",
          display: "grid",
          placeItems: "center",
          fontSize: 26,
          color: "#c7d2fe",
          boxShadow: "0 0 36px rgba(99,102,241,0.22)",
        }}
      >
        ✦
      </div>

      <h3
        style={{
          position: "relative",
          margin: 0,
          color: "#f3f4f6",
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          position: "relative",
          margin: "10px auto 0",
          maxWidth: 500,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {description}
      </p>

      {hint ? (
        <div
          style={{
            position: "relative",
            marginTop: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 999,
            color: "#c7d2fe",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.18)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function ActiveSubscriptionCard({ subscription, nowTs }) {
  const endsAt = getSubscriptionEndsAt(subscription);
  const countdown = buildCountdown(endsAt, nowTs);
  const active = isSubscriptionActive(subscription);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(34,197,94,0.18)",
        borderRadius: 28,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
        padding: 22,
        boxShadow: "0 18px 42px rgba(0,0,0,0.24)",
        display: "grid",
        gap: 16,
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 24px 52px rgba(0,0,0,0.30)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.26)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 18px 42px rgba(0,0,0,0.24)";
        event.currentTarget.style.borderColor = "rgba(34,197,94,0.18)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: active
            ? "radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 36%)"
            : "radial-gradient(circle at top right, rgba(239,68,68,0.10), transparent 36%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.16)",
              background: "rgba(34,197,94,0.06)",
              color: "#86efac",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Assinatura ativa
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
            }}
          >
            {getPlanName(subscription)}
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 360,
            }}
          >
            Acesso vinculado à sua conta com validade individual e atualização em tempo real.
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
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
                ? "0 0 14px rgba(34,197,94,0.8)"
                : "0 0 12px rgba(239,68,68,0.5)",
            }}
          />
          {active ? "Ativo" : "Expirado"}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(34,197,94,0.18)",
            background: "rgba(34,197,94,0.06)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Tempo restante
          </div>

          <div
            style={{
              color: active ? "#86efac" : "#fca5a5",
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {countdown.label}
          </div>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: "1px solid #1f2937",
            background: "rgba(255,255,255,0.03)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Expira em
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.55,
            }}
          >
            {endsAt ? new Date(endsAt).toLocaleString("pt-BR") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserHome() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/plans");
        setPlans(getPlansList(response).filter(isPlanActive));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscriptions(getSubscriptionsList(response));
      } catch (error) {
        setSubscriptions([]);
        setSubscriptionsError(error?.response?.data?.message || "");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    loadPlans();
    loadSubscriptions();
  }, []);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(isSubscriptionActive);
  }, [subscriptions, nowTs]);

  const totalActiveAccess = activeSubscriptions.length;

  const nextExpiration = useMemo(() => {
    if (!activeSubscriptions.length) return null;

    const sorted = [...activeSubscriptions].sort((a, b) => {
      const aTime = new Date(getSubscriptionEndsAt(a) || 0).getTime();
      const bTime = new Date(getSubscriptionEndsAt(b) || 0).getTime();
      return aTime - bTime;
    });

    return sorted[0] || null;
  }, [activeSubscriptions]);

  const nextExpirationCountdown = useMemo(() => {
    if (!nextExpiration) return null;
    return buildCountdown(getSubscriptionEndsAt(nextExpiration), nowTs);
  }, [nextExpiration, nowTs]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .user-home-top-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.15fr 0.85fr;
        }

        .user-home-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .user-home-plans-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .user-home-subscriptions-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .user-home-top-grid,
          .user-home-plans-grid,
          .user-home-subscriptions-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .user-home-top-grid,
          .user-home-stats-grid,
          .user-home-plans-grid,
          .user-home-subscriptions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(99, 102, 241, 0.22)",
          background:
            "linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          boxShadow: "0 22px 72px rgba(0,0,0,0.30)",
          transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "translateY(-2px)";
          event.currentTarget.style.boxShadow = "0 22px 72px rgba(0,0,0,0.30)";
          event.currentTarget.style.borderColor = "rgba(99,102,241,0.28)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "translateY(0)";
          event.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,0.25)";
          event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 85% 15%, rgba(99,102,241,0.22), transparent 24%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ maxWidth: 720 }}>
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
                textTransform: "uppercase",
              }}
            >
              Área do usuário
            </div>

            <h1
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 38,
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              Bem-vindo, {user?.username || user?.name || "usuário"}
            </h1>

            <p
              style={{
                margin: "14px 0 0",
                color: "#9ca3af",
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 680,
              }}
            >
              Veja seus acessos ativos, acompanhe o tempo restante de cada plano
              e confira os planos disponíveis.
            </p>
          </div>

          {activeSubscriptions.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: 12,
                minWidth: 260,
              }}
            >
              <div
                style={{
                  borderRadius: 20,
                  border: "1px solid rgba(34,197,94,0.18)",
                  background: "rgba(34,197,94,0.05)",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Acessos ativos
                </div>
                <div
                  style={{
                    color: "#86efac",
                    fontWeight: 800,
                    fontSize: 22,
                  }}
                >
                  {totalActiveAccess}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  border: "1px solid #1f2937",
                  background: "rgba(255,255,255,0.04)",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Próxima expiração
                </div>
                <div
                  style={{
                    color: "#f3f4f6",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {nextExpirationCountdown?.label || "—"}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {(activeSubscriptions.length > 0 ||
        subscriptionsError ||
        loadingSubscriptions) && (
        <div className="user-home-top-grid">
          <SectionCard
            title="Resumo do acesso"
            subtitle="Visão geral das assinaturas ativas."
          >
            <div className="user-home-stats-grid">
              <StatCard
                label="Acessos ativos"
                value={loadingSubscriptions ? "..." : totalActiveAccess}
                helpText={
                  loadingSubscriptions
                    ? "Carregando assinaturas..."
                    : totalActiveAccess > 0
                    ? "Planos válidos para este usuário."
                    : "Nenhum acesso ativo encontrado."
                }
                accent="success"
              />

              <StatCard
                label="Próximo vencimento"
                value={
                  loadingSubscriptions
                    ? "..."
                    : nextExpirationCountdown?.label || "—"
                }
                helpText={
                  nextExpiration
                    ? getPlanName(nextExpiration)
                    : "Sem vencimentos futuros."
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Situação atual"
            subtitle="Status consolidado dos seus acessos."
          >
            <div
              style={{
                borderRadius: 22,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.03)",
                padding: 18,
              }}
            >
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {activeSubscriptions.length > 0
                  ? `${activeSubscriptions.length} acesso(s) ativo(s)`
                  : "Nenhuma assinatura ativa"}
              </div>

              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {activeSubscriptions.length > 0
                  ? "Cada plano ativo aparece abaixo com seu contador em tempo real."
                  : subscriptionsError || "Assine um plano para liberar acessos."}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard
        title="Seus acessos ativos"
        subtitle="Cada plano possui seu próprio tempo e sua própria validade."
      >
        {loadingSubscriptions ? (
          <div style={{ color: "#9ca3af", fontSize: 14, display: "grid", gap: 10 }}>
            <div style={{ height: 14, width: "42%", borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ height: 14, width: "68%", borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ height: 14, width: "56%", borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
          </div>
        ) : activeSubscriptions.length === 0 ? (
          <EmptyState
            title="Nenhum acesso ativo"
            description="Você ainda não possui uma assinatura ativa neste momento."
            hint="Assine um plano para liberar acessos e ver o contador em tempo real."
          />
        ) : (
          <div className="user-home-subscriptions-grid">
            {activeSubscriptions.map((subscription) => (
              <ActiveSubscriptionCard
                key={subscription.id}
                subscription={subscription}
                nowTs={nowTs}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Planos disponíveis"
        subtitle="Escolha um novo plano e habilite novos acessos."
      >
        {loadingPlans ? (
          <div style={{ color: "#9ca3af", fontSize: 14, display: "grid", gap: 10 }}>
            <div style={{ height: 180, borderRadius: 22, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: 180, borderRadius: 22, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: 180, borderRadius: 22, background: "rgba(255,255,255,0.05)" }} />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title="Nenhum plano encontrado"
            description="No momento não há planos disponíveis para assinatura."
            hint="Assim que houver planos ativos, eles aparecerão aqui."
          />
        ) : (
          <div className="user-home-plans-grid">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} user={user} showCheckout />
            ))}
          </div>
        )}
      </SectionCard>

      <UserHomeFooter />
    </div>
  );
}
