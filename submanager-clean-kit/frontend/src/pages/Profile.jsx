import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

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
    "Plano ativo"
  );
}

function getEndsAt(subscription) {
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

  const endsAt = getEndsAt(subscription);
  if (!endsAt) return false;

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() > Date.now();
}

function buildCountdown(endsAt, nowTs) {
  if (!endsAt) {
    return {
      expired: true,
      label: "Expirada",
    };
  }

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) {
    return {
      expired: true,
      label: "Expirada",
    };
  }

  const diffMs = endDate.getTime() - nowTs;

  if (diffMs <= 0) {
    return {
      expired: true,
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
    label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

      {children}
    </section>
  );
}

function StatCard({ label, value, helpText, accent = "primary" }) {
  const accents = {
    primary: {
      value: "#f3f4f6",
      border: "rgba(99,102,241,0.16)",
      bg: "rgba(255,255,255,0.02)",
    },
    success: {
      value: "#86efac",
      border: "rgba(34,197,94,0.18)",
      bg: "rgba(34,197,94,0.05)",
    },
  };

  const theme = accents[accent] || accents.primary;

  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        borderRadius: 22,
        background: theme.bg,
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
        {label}
      </div>

      <div
        style={{
          color: theme.value,
          fontSize: 32,
          lineHeight: 1.05,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      <div
        style={{
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

function AccessCard({ subscription, nowTs }) {
  const countdown = buildCountdown(getEndsAt(subscription), nowTs);
  const active = isSubscriptionActive(subscription);

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        padding: 20,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
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
              color: "#f3f4f6",
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.25,
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
            }}
          >
            Acesso ativo vinculado à sua conta.
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
            padding: "6px 10px",
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
                ? "0 0 12px rgba(34,197,94,0.75)"
                : "0 0 10px rgba(239,68,68,0.45)",
            }}
          />
          {active ? "Ativo" : "Expirado"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(34,197,94,0.18)",
            background: "rgba(34,197,94,0.05)",
            padding: "14px 16px",
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
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {countdown.label}
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
              lineHeight: 1.5,
            }}
          >
            {formatDate(getEndsAt(subscription))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
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

    loadSubscriptions();
  }, []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter(isSubscriptionActive),
    [subscriptions, nowTs]
  );

  const nextExpiration = useMemo(() => {
    if (!activeSubscriptions.length) return null;

    const sorted = [...activeSubscriptions].sort((a, b) => {
      const aTime = new Date(getEndsAt(a) || 0).getTime();
      const bTime = new Date(getEndsAt(b) || 0).getTime();
      return aTime - bTime;
    });

    return sorted[0] || null;
  }, [activeSubscriptions]);

  const nextExpirationCountdown = useMemo(() => {
    if (!nextExpiration) return null;
    return buildCountdown(getEndsAt(nextExpiration), nowTs);
  }, [nextExpiration, nowTs]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .profile-top-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.1fr 0.9fr;
        }

        .profile-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .profile-access-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .profile-top-grid,
          .profile-access-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .profile-top-grid,
          .profile-stats-grid,
          .profile-access-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
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
              Seu perfil
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
              {user?.username || "Usuário"}
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
              Gerencie sua conta e acompanhe seus acessos ativos com clareza.
            </p>
          </div>

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
                {loadingSubscriptions ? "..." : activeSubscriptions.length}
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
                {loadingSubscriptions
                  ? "..."
                  : nextExpirationCountdown?.label || "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-top-grid">
        <SectionCard
          title="Dados da conta"
          subtitle="Informações principais da sua conta."
        >
          <div style={{ display: "grid", gap: 14 }}>
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
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Nome de usuário
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {user?.username || "—"}
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
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                E-mail
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 16,
                  fontWeight: 800,
                  wordBreak: "break-word",
                }}
              >
                {user?.email || "—"}
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
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Conta criada em
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {formatDate(user?.createdAt)}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Resumo do acesso"
          subtitle="Status atual das suas assinaturas."
        >
          <div className="profile-stats-grid">
            <StatCard
              label="Acessos ativos"
              value={loadingSubscriptions ? "..." : activeSubscriptions.length}
              helpText="Planos válidos no momento."
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
                  : subscriptionsError || "Nenhum vencimento próximo."
              }
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Acessos ativos"
        subtitle="Cada plano possui seu próprio tempo e validade."
      >
        {loadingSubscriptions ? (
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            Carregando assinaturas...
          </div>
        ) : activeSubscriptions.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(99, 102, 241, 0.22)",
              borderRadius: 24,
              padding: 28,
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(11,15,20,0.4) 100%)",
              color: "#9ca3af",
            }}
          >
            Você não possui nenhum acesso ativo no momento.
          </div>
        ) : (
          <div className="profile-access-grid">
            {activeSubscriptions.map((subscription) => (
              <AccessCard
                key={subscription.id}
                subscription={subscription}
                nowTs={nowTs}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
const [profileSummary, setProfileSummary] = useState(null);
const [loadingSummary, setLoadingSummary] = useState(true);

useEffect(() => {
  const loadSummary = async () => {
    try {
      const response = await api.get("/profile/summary");
      setProfileSummary(response?.summary || response?.data?.summary || null);
    } catch {
      setProfileSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  loadSummary();
}, []);

<SectionCard
  title="Atividade"
  subtitle="Resumo básico do seu histórico."
>
  <div className="profile-stats-grid">
    <StatCard
      label="Vitórias"
      value={loadingSummary ? "..." : profileSummary?.wins ?? 0}
      helpText="Vitórias registradas pelo supervisor."
      accent="success"
    />
    <StatCard
      label="Última vitória"
      value={
        loadingSummary
          ? "..."
          : profileSummary?.latestWinAt
          ? new Date(profileSummary.latestWinAt).toLocaleDateString("pt-BR")
          : "—"
      }
      helpText="Último resultado reconhecido no sistema."
    />
  </div>
</SectionCard>