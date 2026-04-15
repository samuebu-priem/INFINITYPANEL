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

function getSummaryObject(response) {
  if (!response) return null;
  if (response.summary) return response.summary;
  if (response.data?.summary) return response.data.summary;
  if (response.data) return response.data;
  return response;
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
  if (!endsAt) return { expired: true, label: "Expirada" };

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return { expired: true, label: "Expirada" };

  const diffMs = endDate.getTime() - nowTs;
  if (diffMs <= 0) return { expired: true, label: "Expirada" };

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

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      width="22"
      height="22"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        fill="currentColor"
        d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96.36a77.7 77.7 0 0 0 6.89-11.27 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.26A105.25 105.25 0 0 0 126.6 80.22c2.64-27.35-4.5-51.08-18.9-72.15ZM42.45 65.69c-6.27 0-11.42-5.71-11.42-12.73S36.06 40.23 42.45 40.23 53.87 45.94 53.76 52.96c0 7.02-5.15 12.73-11.31 12.73Zm42.24 0c-6.27 0-11.42-5.71-11.42-12.73S78.3 40.23 84.69 40.23s11.42 5.71 11.31 12.73c0 7.02-5.04 12.73-11.31 12.73Z"
      />
    </svg>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [profileSummary, setProfileSummary] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  const [discordIdInput, setDiscordIdInput] = useState("");
  const [savingDiscordId, setSavingDiscordId] = useState(false);
  const [discordMessage, setDiscordMessage] = useState("");

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

    const loadSummary = async () => {
      try {
        const response = await api.get("/profile/summary");
        const summary = getSummaryObject(response);
        setProfileSummary(summary);
        setDiscordIdInput(summary?.discordId || "");
      } catch {
        setProfileSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadSubscriptions();
    loadSummary();
  }, []);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(isSubscriptionActive);
  }, [subscriptions]);

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

  const handleSaveDiscordId = async (event) => {
    event.preventDefault();
    setSavingDiscordId(true);
    setDiscordMessage("");

    try {
      const response = await api.patch("/profile/discord", {
        discordId: discordIdInput,
      });

      const savedDiscordId =
        response?.profile?.discordId ||
        response?.data?.profile?.discordId ||
        discordIdInput;

      setProfileSummary((current) => ({
        ...(current || {}),
        discordId: savedDiscordId,
      }));

      setDiscordIdInput(savedDiscordId);
      setDiscordMessage("ID do Discord vinculado com sucesso.");
    } catch (error) {
      setDiscordMessage(
        error?.response?.data?.message ||
          "Não foi possível vincular o ID do Discord."
      );
    } finally {
      setSavingDiscordId(false);
    }
  };

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

        .profile-discord-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr auto;
          align-items: end;
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
          .profile-access-grid,
          .profile-discord-grid {
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
              Gerencie sua conta, acompanhe seus acessos e vincule seu Discord.
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
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Nome de usuário
              </div>
              <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800 }}>
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
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                E-mail
              </div>
              <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800, wordBreak: "break-word" }}>
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
              <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Conta criada em
              </div>
              <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800 }}>
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
        title="Vincular Discord"
        subtitle="Pegue seu ID no canal do Discord e cole abaixo para conectar sua conta."
      >
        <div
          style={{
            border: "1px solid rgba(88, 101, 242, 0.28)",
            background:
              "linear-gradient(180deg, rgba(88,101,242,0.12) 0%, rgba(17,24,39,0.35) 100%)",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 0 28px rgba(88,101,242,0.12)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              color: "#c7d2fe",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: "rgba(88,101,242,0.18)",
                border: "1px solid rgba(88,101,242,0.28)",
                color: "#5865F2",
              }}
            >
              <DiscordIcon />
            </span>
            Discord
          </div>

          <form onSubmit={handleSaveDiscordId} style={{ display: "grid", gap: 14 }}>
            <div className="profile-discord-grid">
              <label style={{ display: "grid", gap: 8 }}>
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Seu ID do Discord
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={discordIdInput}
                  onChange={(event) => setDiscordIdInput(event.target.value)}
                  placeholder="Ex: 123456789012345678"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid rgba(88,101,242,0.30)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                    boxShadow: "0 0 20px rgba(88,101,242,0.06)",
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={savingDiscordId}
                style={{
                  height: 52,
                  padding: "0 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(88,101,242,0.50)",
                  background:
                    "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: savingDiscordId ? "not-allowed" : "pointer",
                  opacity: savingDiscordId ? 0.7 : 1,
                  boxShadow: "0 0 28px rgba(88,101,242,0.18)",
                }}
              >
                {savingDiscordId ? "Salvando..." : "Salvar ID"}
              </button>
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Vá ao canal criado no Discord, clique no botão para ver seu ID e
              cole o número aqui.
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(88,101,242,0.24)",
                  background: "rgba(88,101,242,0.10)",
                  color: "#c7d2fe",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                ID vinculado: {profileSummary?.discordId || "não vinculado"}
              </div>

              {discordMessage ? (
                <div
                  style={{
                    color: discordMessage.toLowerCase().includes("sucesso")
                      ? "#86efac"
                      : "#fca5a5",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {discordMessage}
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </SectionCard>

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