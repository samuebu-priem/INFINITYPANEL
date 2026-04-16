import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { UserHomeFooter } from "../components/layout/UserHomeFooter.jsx";
import { Crown, Flame, ShieldCheck, Users } from "lucide-react";

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
  if (Array.isArray(response?.data?.subscriptions)) return response.data.subscriptions;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.subscription) return [response.subscription];
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

function getRankingList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.ranking)) return response.ranking;
  if (Array.isArray(response?.data?.ranking)) return response.data.ranking;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getDiscordAvatarUrlFromRankingItem(item) {
  const directAvatar =
    item?.avatar ??
    item?.avatarUrl ??
    item?.photoUrl ??
    item?.imageUrl ??
    item?.profileImage ??
    null;

  if (directAvatar) return directAvatar;

  const discordId = item?.discordId ?? item?.userDiscordId ?? null;
  const discordAvatar = item?.discordAvatar ?? item?.userDiscordAvatar ?? null;

  if (discordId && discordAvatar) {
    const isAnimated = String(discordAvatar).startsWith("a_");
    const ext = isAnimated ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.${ext}?size=128`;
  }

  if (discordId) {
    return `https://cdn.discordapp.com/embed/avatars/${Number(discordId) % 5}.png`;
  }

  return null;
}

function normalizeRankingItem(item, index) {
  const position = Number(item?.position ?? index + 1);
  const name =
    item?.username ??
    item?.nick ??
    item?.nickname ??
    item?.name ??
    item?.playerName ??
    item?.displayName ??
    "Jogador";

  const wins = Number(
    item?.wins ?? item?.vitórias ?? item?.vitorias ?? item?.victories ?? 0
  );
  const matches = Number(item?.matches ?? item?.partidas ?? item?.games ?? 0);

  return {
    raw: item,
    position,
    name,
    avatar: getDiscordAvatarUrlFromRankingItem(item),
    wins,
    matches,
  };
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
    return { expired: true, label: "Expirada" };
  }

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) {
    return { expired: true, label: "Expirada" };
  }

  const diffMs = endDate.getTime() - nowTs;

  if (diffMs <= 0) {
    return { expired: true, label: "Expirada" };
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

function EmptyState({ title, description }) {
  return (
    <div
      style={{
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 24,
        color: "#9ca3af",
      }}
    >
      <div
        style={{
          color: "#f3f4f6",
          fontSize: 18,
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.7 }}>{description}</div>
    </div>
  );
}

function RankingAvatar({ item, size = 42, radius = 14, fontSize = 16 }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(item?.avatar) && !failed;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "grid",
        placeItems: "center",
        color: "#f3f4f6",
        fontWeight: 900,
        fontSize,
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={item.avatar}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        (item?.name || "J").slice(0, 1).toUpperCase()
      )}
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
        border: "1px solid rgba(34,197,94,0.18)",
        borderRadius: 26,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
        padding: 20,
        boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
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
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <ShieldCheck size={12} />
            Liberado
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 19,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
            }}
          >
            {getPlanName(subscription)}
          </div>
        </div>

        <div
          style={{
            color: active ? "#86efac" : "#fca5a5",
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
        Expira em{" "}
        <span style={{ color: "#f3f4f6", fontWeight: 700 }}>
          {endsAt ? new Date(endsAt).toLocaleString("pt-BR") : "—"}
        </span>
      </div>
    </div>
  );
}

function RankingLeaderCard({ item }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 30,
        border: "1px solid rgba(250,204,21,0.28)",
        background:
          "linear-gradient(180deg, rgba(250,204,21,0.12) 0%, rgba(17,24,39,0.98) 100%)",
        padding: 22,
        boxShadow: "0 0 34px rgba(250,204,21,0.12)",
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 42,
          height: 42,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(250,204,21,0.16)",
          color: "#fde68a",
          border: "1px solid rgba(250,204,21,0.24)",
        }}
      >
        <Crown size={18} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <RankingAvatar item={item} size={84} radius={28} fontSize={24} />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(250,204,21,0.12)",
              color: "#fde68a",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            #1 da org
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: 8,
              wordBreak: "break-word",
            }}
          >
            {item.name}
          </div>

          <div
            style={{
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Quem tá puxando a frente agora.
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(250,204,21,0.18)",
            background: "rgba(250,204,21,0.08)",
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
            Wins
          </div>

          <div
            style={{
              color: "#fde68a",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            {item.wins}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(88,101,242,0.18)",
            background: "rgba(88,101,242,0.08)",
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
            Partidas
          </div>

          <div
            style={{
              color: "#c7d2fe",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            {item.matches}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingListItem({ item }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 14,
        alignItems: "center",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <RankingAvatar item={item} size={42} radius={14} fontSize={16} />

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "rgba(88,101,242,0.14)",
            border: "1px solid rgba(88,101,242,0.18)",
            color: "#c7d2fe",
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          #{item.position}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#f3f4f6",
            fontSize: 15,
            fontWeight: 800,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {item.matches} partidas
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#86efac",
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        <Flame size={15} />
        {item.wins}
      </div>
    </div>
  );
}

export default function UserHome() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [rankingError, setRankingError] = useState("");
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
        const response = await api.get("/subscriptions/me", { auth: true });
        setSubscriptions(getSubscriptionsList(response));
      } catch (error) {
        setSubscriptions([]);
        setSubscriptionsError(error?.response?.data?.message || "");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    const loadRanking = async () => {
      try {
        const response = await api.get("/rankings/public?period=total");
        setRanking(getRankingList(response).map(normalizeRankingItem).slice(0, 8));
      } catch (error) {
        setRanking([]);
        setRankingError(error?.response?.data?.message || "");
      } finally {
        setLoadingRanking(false);
      }
    };

    loadPlans();
    loadSubscriptions();
    loadRanking();
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

  const leader = useMemo(() => ranking[0] || null, [ranking]);
  const restRanking = useMemo(() => ranking.slice(1), [ranking]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .user-home-hero-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.15fr 0.85fr;
        }

        .user-home-plans-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start;
        }

        @media (max-width: 1180px) {
          .user-home-hero-grid,
          .user-home-plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .user-home-hero-grid,
          .user-home-plans-grid {
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
          boxShadow: "0 22px 72px rgba(0,0,0,0.32)",
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

        <div className="user-home-hero-grid" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
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
              Lobby da org
            </div>

            <h1
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 40,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              Fala, {user?.username || user?.name || "jogador"}
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
              Confere teus acessos, vê quem tá dominando e escolhe teu próximo plano.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(34,197,94,0.18)",
                background: "rgba(34,197,94,0.06)",
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
                  fontWeight: 900,
                  fontSize: 24,
                }}
              >
                {loadingSubscriptions ? "..." : totalActiveAccess}
              </div>
            </div>

            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
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
                Próximo vencimento
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {loadingSubscriptions ? "..." : nextExpirationCountdown?.label || "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="user-home-hero-grid">
        <section
          style={{
            borderRadius: 30,
            border: "1px solid rgba(88,101,242,0.18)",
            background:
              "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
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
                  color: "#f3f4f6",
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                }}
              >
                Quem tá dominando
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Os caras que tão puxando a frente agora.
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(250,204,21,0.10)",
                border: "1px solid rgba(250,204,21,0.18)",
                color: "#fde68a",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Crown size={14} />
              Top da org
            </div>
          </div>

          {loadingRanking ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ height: 220, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ height: 76, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ height: 76, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />
            </div>
          ) : !leader ? (
            <EmptyState
              title="Sem ranking no momento"
              description={rankingError || "Ainda não tem movimento suficiente pra mostrar aqui."}
            />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <RankingLeaderCard item={leader} />

              {restRanking.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {restRanking.map((item) => (
                    <RankingListItem key={`${item.position}-${item.name}`} item={item} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.03)",
                    padding: 16,
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  Ainda não tem jogadores suficientes no ranking pra preencher a lista.
                </div>
              )}
            </div>
          )}
        </section>

        <section
          style={{
            borderRadius: 30,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              Teus acessos
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              O que tá liberado na tua conta agora.
            </p>
          </div>

          {loadingSubscriptions ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ height: 110, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ height: 110, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
            </div>
          ) : activeSubscriptions.length === 0 ? (
            <EmptyState
              title="Sem acesso ativo"
              description={subscriptionsError || "Assina um plano pra liberar teu acesso dentro da Infinity."}
            />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {activeSubscriptions.map((subscription) => (
                <ActiveSubscriptionCard
                  key={subscription.id || `${getPlanName(subscription)}-${getSubscriptionEndsAt(subscription)}`}
                  subscription={subscription}
                  nowTs={nowTs}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section
        style={{
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
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
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              Escolhe teu acesso
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Pega o plano que encaixa melhor no teu jogo.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(88,101,242,0.10)",
              border: "1px solid rgba(88,101,242,0.18)",
              color: "#c7d2fe",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <Users size={14} />
            Planos disponíveis
          </div>
        </div>

        {loadingPlans ? (
          <div className="user-home-plans-grid">
            <div style={{ height: 220, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: 220, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: 220, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title="Nenhum plano disponível"
            description="No momento não há planos ativos para assinatura."
          />
        ) : (
          <div className="user-home-plans-grid">
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  minWidth: 0,
                  display: "flex",
                }}
              >
                <div style={{ width: "100%", display: "flex" }}>
                  <PlanCard plan={plan} user={user} showCheckout />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <UserHomeFooter />
    </div>
  );
}