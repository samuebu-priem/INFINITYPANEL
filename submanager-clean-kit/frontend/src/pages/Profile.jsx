import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

function getSubscriptionsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subscriptions)) return response.subscriptions;
  if (Array.isArray(response?.data?.subscriptions)) return response.data.subscriptions;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.subscription) return [response.subscription];
  return [];
}

function getSummaryObject(response) {
  if (!response) return null;
  if (response.summary) return response.summary;
  if (response.data?.summary) return response.data.summary;
  if (response.data) return response.data;
  return response;
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

function formatNumber(value, fallback = "0") {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat("pt-BR").format(number);
}

function formatCurrency(value, fallback = "R$ 0,00") {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function getDiscordAvatarUrl(summary) {
  if (!summary?.discordId) return "";

  if (summary?.discordAvatar) {
    const isAnimated = String(summary.discordAvatar).startsWith("a_");
    const ext = isAnimated ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${summary.discordId}/${summary.discordAvatar}.${ext}?size=256`;
  }

  return `https://cdn.discordapp.com/embed/avatars/${Number(summary.discordId) % 5}.png`;
}

function getDiscordName(summary, user) {
  return (
    summary?.discordGuildNick ||
    summary?.discordGlobalName ||
    summary?.discordUsername ||
    user?.username ||
    "Jogador"
  );
}

function StatCard({ label, value, helpText, accent = "default" }) {
  const theme =
    accent === "success"
      ? {
          border: "rgba(34,197,94,0.18)",
          bg: "rgba(34,197,94,0.06)",
          value: "#86efac",
        }
      : accent === "discord"
      ? {
          border: "rgba(88,101,242,0.28)",
          bg: "rgba(88,101,242,0.10)",
          value: "#c7d2fe",
        }
      : {
          border: "rgba(255,255,255,0.08)",
          bg: "rgba(255,255,255,0.03)",
          value: "#f8fafc",
        };

  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${theme.border}`,
        background: theme.bg,
        padding: 18,
        minHeight: 142,
      }}
    >
      <div
        style={{
          color: "#9ca3af",
          fontSize: 11,
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
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {helpText}
      </div>
    </div>
  );
}

function ActiveAccessCard({ subscription, nowTs }) {
  const endsAt = getSubscriptionEndsAt(subscription);
  const countdown = buildCountdown(endsAt, nowTs);

  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid rgba(34,197,94,0.18)",
        background: "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
        padding: 18,
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
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.18)",
              background: "rgba(34,197,94,0.08)",
              color: "#86efac",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            No jogo
          </div>

          <div
            style={{
              color: "#f8fafc",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {subscription?.plan?.name || subscription?.planName || "Plano ativo"}
          </div>
        </div>

        <div
          style={{
            color: "#86efac",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {countdown.label}
        </div>
      </div>

      <div
        style={{
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Vai até {formatDate(endsAt)}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const loadProfileData = async () => {
    const [subsRes, summaryRes] = await Promise.all([
      api.get("/subscriptions/me", { auth: true }),
      api.get("/profile/summary", { auth: true }),
    ]);

    setSubscriptions(getSubscriptionsList(subsRes));
    setSummary(getSummaryObject(summaryRes));
  };

  useEffect(() => {
    async function init() {
      try {
        await loadProfileData();
      } catch (error) {
        console.error("Erro ao carregar profile:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = params.get("discord");

    if (!discordStatus) return;

    async function refreshAfterRedirect() {
      try {
        await loadProfileData();

        if (discordStatus === "connected") {
          setFeedback("Discord conectado com sucesso.");
        } else {
          setFeedback("Não foi possível concluir a conexão com o Discord.");
        }
      } catch (error) {
        console.error("Erro ao recarregar profile após callback:", error);
        setFeedback("Não foi possível atualizar seu perfil agora.");
      } finally {
        window.history.replaceState({}, document.title, "/profile");
      }
    }

    refreshAfterRedirect();
  }, []);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(isSubscriptionActive);
  }, [subscriptions, nowTs]);

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

  const discordConnected = Boolean(summary?.discordId);
  const discordAvatarUrl = getDiscordAvatarUrl(summary);
  const discordName = getDiscordName(summary, user);

  const handleConnectDiscord = async () => {
    try {
      setLoadingConnect(true);
      setFeedback("");

      const res = await api.get("/auth/discord/url", { auth: true });

      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      setFeedback("Não foi possível iniciar a conexão com o Discord.");
    } catch (err) {
      console.error("Erro ao conectar Discord:", err);
      setFeedback("Não foi possível iniciar a conexão com o Discord.");
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    try {
      setLoadingDisconnect(true);
      setFeedback("");

      await api.delete("/profile/discord", { auth: true });
      await loadProfileData();

      setFeedback("Discord desconectado.");
    } catch (err) {
      console.error("Erro ao desconectar Discord:", err);
      setFeedback("Não foi possível desconectar o Discord.");
    } finally {
      setLoadingDisconnect(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .profile-hero-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.1fr 0.9fr;
        }

        .profile-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .profile-access-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .profile-hero-grid,
          .profile-stats-grid,
          .profile-access-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .profile-hero-grid,
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
          borderRadius: 34,
          padding: 28,
          border: "1px solid rgba(88,101,242,0.22)",
          background:
            "linear-gradient(135deg, rgba(11,17,28,0.98) 0%, rgba(8,11,18,0.99) 55%, rgba(14,22,38,0.98) 100%)",
          boxShadow: "0 22px 72px rgba(0,0,0,0.34)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 85% 15%, rgba(88,101,242,0.18), transparent 24%)",
          }}
        />

        <div className="profile-hero-grid" style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(88,101,242,0.12)",
                  border: "1px solid rgba(88,101,242,0.18)",
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
                  color: "#f8fafc",
                  fontSize: 38,
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                {discordName}
              </h1>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#9ca3af",
                  fontSize: 15,
                  lineHeight: 1.7,
                  maxWidth: 720,
                }}
              >
                Sua presença, seus números e seus acessos dentro da Infinity.
              </p>
            </div>

            {feedback ? (
              <div
                style={{
                  width: "fit-content",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("conectado")
                    ? "1px solid rgba(34,197,94,0.22)"
                    : "1px solid rgba(239,68,68,0.22)",
                  background: feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("conectado")
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(239,68,68,0.08)",
                  color: feedback.toLowerCase().includes("sucesso") || feedback.toLowerCase().includes("conectado")
                    ? "#86efac"
                    : "#fca5a5",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {feedback}
              </div>
            ) : null}
          </div>

          <div
            style={{
              borderRadius: 30,
              border: "1px solid rgba(88,101,242,0.22)",
              background: "rgba(255,255,255,0.03)",
              padding: 22,
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 28,
                  overflow: "hidden",
                  background: "rgba(88,101,242,0.14)",
                  border: "1px solid rgba(88,101,242,0.22)",
                  display: "grid",
                  placeItems: "center",
                  color: "#e5e7eb",
                  fontSize: 28,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {discordAvatarUrl ? (
                  <img
                    src={discordAvatarUrl}
                    alt={discordName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (user?.username || "U").slice(0, 1).toUpperCase()
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#f8fafc",
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {discordName}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color: discordConnected ? "#c7d2fe" : "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {discordConnected
                    ? summary?.discordUsername
                      ? `@${summary.discordUsername}`
                      : "Conta conectada"
                    : "Conecte seu Discord para completar seu perfil"}
                </div>

                {discordConnected && summary?.discordConnectedAt ? (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#9ca3af",
                      fontSize: 13,
                    }}
                  >
                    Conectado em {formatDate(summary.discordConnectedAt)}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {discordConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectDiscord}
                  disabled={loadingDisconnect}
                  style={{
                    height: 46,
                    padding: "0 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(239,68,68,0.28)",
                    background: "rgba(239,68,68,0.12)",
                    color: "#fecaca",
                    fontWeight: 800,
                    cursor: loadingDisconnect ? "not-allowed" : "pointer",
                    opacity: loadingDisconnect ? 0.75 : 1,
                  }}
                >
                  {loadingDisconnect ? "Desconectando..." : "Desconectar Discord"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectDiscord}
                  disabled={loadingConnect}
                  style={{
                    height: 48,
                    padding: "0 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(88,101,242,0.32)",
                    background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
                    color: "#ffffff",
                    fontWeight: 900,
                    cursor: loadingConnect ? "not-allowed" : "pointer",
                    boxShadow: "0 12px 28px rgba(88,101,242,0.18)",
                    opacity: loadingConnect ? 0.8 : 1,
                  }}
                >
                  {loadingConnect ? "Abrindo..." : "Conectar com Discord"}
                </button>
              )}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: discordConnected
                    ? "1px solid rgba(34,197,94,0.22)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: discordConnected
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(255,255,255,0.04)",
                  color: discordConnected ? "#86efac" : "#9ca3af",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {discordConnected ? "Discord ligado" : "Discord desligado"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-stats-grid">
        <StatCard
          label="Vitórias"
          value={loading ? "..." : formatNumber(summary?.wins, "0")}
          helpText="Vitórias registradas na sua conta."
        />

        <StatCard
          label="Partidas"
          value={loading ? "..." : formatNumber(summary?.matchesPlayed, "0")}
          helpText="Partidas ligadas ao seu Discord."
        />

        <StatCard
          label="Partidas mediadas"
          value={loading ? "..." : formatNumber(summary?.mediatedMatchesCount, "0")}
          helpText="Vezes em que você mediou."
          accent="discord"
        />

        <StatCard
          label="Lucro mediando"
          value={loading ? "..." : formatCurrency(summary?.mediatorProfitTotal)}
          helpText="Total acumulado como mediador."
          accent="success"
        />
      </div>

      <section
        style={{
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#f8fafc",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              Seus acessos
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Tudo que está ativo na sua conta agora.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              minWidth: 220,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(34,197,94,0.18)",
                background: "rgba(34,197,94,0.06)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                Acessos ativos
              </div>
              <div
                style={{
                  color: "#86efac",
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                {loading ? "..." : activeSubscriptions.length}
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                Próximo vencimento
              </div>
              <div
                style={{
                  color: "#f8fafc",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {loading ? "..." : nextExpirationCountdown?.label || "—"}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#9ca3af" }}>Carregando...</div>
        ) : activeSubscriptions.length ? (
          <div className="profile-access-grid">
            {activeSubscriptions.map((subscription) => (
              <ActiveAccessCard
                key={subscription.id || `${subscription?.plan?.name}-${subscription?.endsAt}`}
                subscription={subscription}
                nowTs={nowTs}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              padding: 18,
              color: "#9ca3af",
              lineHeight: 1.7,
            }}
          >
            Você não tem nenhum acesso ativo agora.
          </div>
        )}
      </section>
    </div>
  );
}