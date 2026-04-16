import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

function getRankingList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.ranking)) return response.ranking;
  if (Array.isArray(response?.data?.ranking)) return response.data.ranking;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function normalizeRankingItem(item, index) {
  const position = Number(item?.position ?? index + 1);
  const username =
    item?.username ??
    item?.nick ??
    item?.nickname ??
    item?.name ??
    item?.playerName ??
    item?.displayName ??
    "Jogador";

  const status = item?.status ?? item?.title ?? item?.rankTitle ?? item?.role ?? null;
  const avatar = item?.avatar ?? item?.photoUrl ?? item?.imageUrl ?? item?.profileImage ?? null;
  const matches = Number(item?.matches ?? item?.partidas ?? item?.games ?? 0);
  const wins = Number(item?.wins ?? item?.vitórias ?? item?.vitorias ?? item?.victories ?? 0);
  const earnedValue = item?.earnedValue ?? item?.valorGanho ?? item?.valorGanhoTotal ?? item?.totalEarned ?? null;

  return {
    raw: item,
    position,
    username,
    status,
    avatar,
    matches,
    wins,
    earnedValue: earnedValue !== null && earnedValue !== undefined && earnedValue !== "" ? earnedValue : null,
    discordId: item?.discordId ?? item?.id ?? `${position}-${username}`,
  };
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

function formatPlural(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

function getAvatarGradient(position, accent) {
  if (position === 1) return "linear-gradient(180deg, rgba(251,191,36,0.26), rgba(17,24,39,0.96))";
  if (position === 2) return "linear-gradient(180deg, rgba(226,232,240,0.18), rgba(17,24,39,0.96))";
  if (position === 3) return "linear-gradient(180deg, rgba(251,146,60,0.20), rgba(17,24,39,0.96))";
  return `linear-gradient(180deg, ${accent}26, rgba(17,24,39,0.96))`;
}

function SectionCard({ title, subtitle, children, style = {} }) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(12,16,24,0.98) 0%, rgba(7,10,16,0.98) 100%)",
        border: "1px solid rgba(99,102,241,0.18)",
        borderRadius: 30,
        padding: 24,
        boxShadow: "0 18px 54px rgba(0,0,0,0.28)",
        transition:
          "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
        ...style,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = "0 24px 72px rgba(0,0,0,0.34)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.30)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 18px 54px rgba(0,0,0,0.28)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top right, rgba(34,211,238,0.10), transparent 32%), radial-gradient(circle at bottom left, rgba(99,102,241,0.10), transparent 28%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            color: "#f8fafc",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </section>
  );
}

function PeriodButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 44,
        padding: "0 16px",
        borderRadius: 14,
        border: active ? "1px solid rgba(34,211,238,0.45)" : "1px solid #1f2937",
        background: active
          ? "linear-gradient(180deg, rgba(34,211,238,0.16) 0%, rgba(99,102,241,0.10) 100%)"
          : "rgba(255,255,255,0.03)",
        color: active ? "#cffafe" : "#e5e7eb",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        transition:
          "transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
        event.currentTarget.style.boxShadow = active
          ? "0 10px 24px rgba(34,211,238,0.16)"
          : "0 10px 24px rgba(0,0,0,0.16)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </button>
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
          "linear-gradient(180deg, rgba(99,102,241,0.09) 0%, rgba(7,10,16,0.54) 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top, rgba(34,211,238,0.12), transparent 42%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: 68,
          height: 68,
          borderRadius: 22,
          margin: "0 auto 16px",
          background: "rgba(34,211,238,0.12)",
          display: "grid",
          placeItems: "center",
          fontSize: 26,
          color: "#a5f3fc",
          boxShadow: "0 0 36px rgba(34,211,238,0.22)",
        }}
      >
        ✦
      </div>

      <h3
        style={{
          position: "relative",
          margin: 0,
          color: "#f8fafc",
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
          color: "#94a3b8",
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
            color: "#cffafe",
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.18)",
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

function SkeletonPodiumCard({ height = 248 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(34,211,238,0.06) 50%, rgba(255,255,255,0.03) 100%)",
        backgroundSize: "200% 100%",
        animation: "rankingShimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

function SkeletonListItem() {
  return (
    <div
      style={{
        minHeight: 110,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(34,211,238,0.06) 50%, rgba(255,255,255,0.03) 100%)",
        backgroundSize: "200% 100%",
        animation: "rankingShimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

function LeaderboardCard({ item, variant = "default", compact = false, highlight = false }) {
  const accentMap = {
    gold: {
      accent: "#fbbf24",
      border: "rgba(251,191,36,0.36)",
      glow: "rgba(251,191,36,0.22)",
      background:
        "linear-gradient(180deg, rgba(251,191,36,0.14) 0%, rgba(11,15,23,0.98) 100%)",
    },
    silver: {
      accent: "#e2e8f0",
      border: "rgba(203,213,225,0.34)",
      glow: "rgba(203,213,225,0.16)",
      background:
        "linear-gradient(180deg, rgba(203,213,225,0.10) 0%, rgba(11,15,23,0.98) 100%)",
    },
    bronze: {
      accent: "#fb923c",
      border: "rgba(251,146,60,0.32)",
      glow: "rgba(251,146,60,0.16)",
      background:
        "linear-gradient(180deg, rgba(251,146,60,0.10) 0%, rgba(11,15,23,0.98) 100%)",
    },
    default: {
      accent: "#22d3ee",
      border: "rgba(34,211,238,0.18)",
      glow: "rgba(34,211,238,0.12)",
      background:
        "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(7,10,16,0.98) 100%)",
    },
    self: {
      accent: "#22d3ee",
      border: "rgba(34,211,238,0.40)",
      glow: "rgba(34,211,238,0.22)",
      background:
        "linear-gradient(180deg, rgba(34,211,238,0.10) 0%, rgba(11,15,23,0.98) 100%)",
    },
  };

  const styleSet = accentMap[variant] || accentMap.default;
  const currency = formatCurrency(item.earnedValue);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        padding: compact ? 18 : 20,
        border: `1px solid ${styleSet.border}`,
        background: styleSet.background,
        boxShadow: highlight
          ? `0 18px 48px ${styleSet.glow}`
          : `0 12px 32px rgba(0,0,0,0.18)`,
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
        display: "grid",
        gap: 14,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = `0 24px 60px ${styleSet.glow}`;
        event.currentTarget.style.borderColor = styleSet.border;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = highlight
          ? `0 18px 48px ${styleSet.glow}`
          : "0 12px 32px rgba(0,0,0,0.18)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 24%), radial-gradient(circle at bottom left, rgba(34,211,238,0.08), transparent 30%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: compact ? 52 : 60,
              height: compact ? 52 : 60,
              borderRadius: 18,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              background: getAvatarGradient(item.position, styleSet.accent),
              border: `1px solid ${styleSet.border}`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 0 28px ${styleSet.glow}`,
              overflow: "hidden",
              color: "#f8fafc",
              fontWeight: 900,
              fontSize: 16,
              textTransform: "uppercase",
            }}
          >
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={item.username}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getInitials(item.username)
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${styleSet.border}`,
                background: "rgba(255,255,255,0.04)",
                color: styleSet.accent,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              #{item.position}
              {item.position === 1 ? " campeão" : item.position === 2 ? " vice" : item.position === 3 ? " pódio" : ""}
            </div>

            <div
              style={{
                color: "#f8fafc",
                fontWeight: 900,
                fontSize: compact ? 16 : 18,
                letterSpacing: "-0.02em",
                wordBreak: "break-word",
              }}
            >
              {item.username}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {item.status ? (
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(99,102,241,0.10)",
                    border: "1px solid rgba(99,102,241,0.18)",
                    color: "#c7d2fe",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {item.status}
                </div>
              ) : null}

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(34,211,238,0.10)",
                  border: "1px solid rgba(34,211,238,0.18)",
                  color: "#cffafe",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {formatPlural(item.matches, "partida", "partidas")}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.18)",
                  color: "#bbf7d0",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {formatPlural(item.wins, "vitória", "vitórias")}
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", flex: "0 0 auto" }}>
          <div style={{ color: styleSet.accent, fontSize: compact ? 18 : 24, fontWeight: 900 }}>
            {formatPlural(item.wins, "vitória", "vitórias")}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>posição competitiva</div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: 10,
          gridTemplateColumns: currency ? "repeat(2, minmax(0, 1fr))" : "1fr",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Participações</div>
          <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>
            {formatPlural(item.matches, "partida", "partidas")}
          </div>
        </div>

        {currency ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 18,
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.10)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Valor ganho total</div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>{currency}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RankingPublic() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("total");
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rankings/public?period=${period}`);
        setRanking(getRankingList(response).map(normalizeRankingItem));
      } catch {
        setRanking([]);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [period]);

  const topThree = useMemo(() => ranking.slice(0, 3), [ranking]);
  const rest = useMemo(() => ranking.slice(3, 99), [ranking]);
  const userKey = user?.discordId ?? user?.id ?? user?.username ?? user?.nickname ?? null;
  const selfItem = useMemo(() => {
    if (!userKey) return null;
    return ranking.find((item) => {
      const candidateKeys = [
        item.raw?.discordId,
        item.raw?.id,
        item.raw?.username,
        item.raw?.nickname,
        item.raw?.name,
      ]
        .filter(Boolean)
        .map(String);
      return candidateKeys.includes(String(userKey));
    });
  }, [ranking, userKey]);

  const podiumMeta = [
    {
      label: "Ouro",
      border: "rgba(251,191,36,0.42)",
      bg: "linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fbbf24",
      glow: "rgba(251,191,36,0.26)",
    },
    {
      label: "Prata",
      border: "rgba(203,213,225,0.38)",
      bg: "linear-gradient(180deg, rgba(203,213,225,0.12) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#e2e8f0",
      glow: "rgba(203,213,225,0.20)",
    },
    {
      label: "Bronze",
      border: "rgba(251,146,60,0.36)",
      bg: "linear-gradient(180deg, rgba(251,146,60,0.14) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fb923c",
      glow: "rgba(251,146,60,0.18)",
    },
  ];

  const selfOutsideTop99 = Boolean(selfItem && selfItem.position > 99);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .ranking-top-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
        }

        .ranking-list-wrap {
          max-height: 920px;
          overflow: auto;
          padding-right: 4px;
        }

        .ranking-list-grid {
          display: grid;
          gap: 12px;
        }

        .ranking-periods {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ranking-header-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: stretch;
        }

        @keyframes rankingShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 980px) {
          .ranking-top-grid,
          .ranking-header-grid {
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
            "linear-gradient(135deg, rgba(14,18,29,0.98) 0%, rgba(7,10,16,0.98) 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 84% 16%, rgba(34,211,238,0.20), transparent 22%), radial-gradient(circle at 15% 22%, rgba(99,102,241,0.14), transparent 24%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              width: "fit-content",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(34,211,238,0.10)",
              border: "1px solid rgba(34,211,238,0.18)",
              color: "#cffafe",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Ranking público
          </div>

          <div className="ranking-header-grid">
            <div style={{ display: "grid", gap: 14 }}>
              <h1
                style={{
                  margin: 0,
                  color: "#f8fafc",
                  fontSize: 40,
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: -0.7,
                  maxWidth: 820,
                }}
              >
                Competição pública da Infinity
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 15,
                  lineHeight: 1.7,
                  maxWidth: 740,
                }}
              >
                Acompanhe o pódio, descubra quem está dominando o período e compare posição,
                vitórias e participação em uma apresentação mais viva e competitiva.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                alignContent: "start",
                padding: 18,
                borderRadius: 24,
                border: "1px solid rgba(34,211,238,0.16)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>Leitura rápida</div>
              <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>
                {ranking.length} jogador(es) neste período
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
                Top 1, Top 2 e Top 3 ganham o palco; da 4ª à 99ª posição, a lista fica rolável e
                organizada.
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Período" subtitle="Escolha a janela de tempo do ranking.">
        <div className="ranking-periods">
          <PeriodButton active={period === "total"} onClick={() => setPeriod("total")}>
            Total
          </PeriodButton>
          <PeriodButton active={period === "weekly"} onClick={() => setPeriod("weekly")}>
            Semanal
          </PeriodButton>
          <PeriodButton active={period === "24h"} onClick={() => setPeriod("24h")}>
            Últimas 24 horas
          </PeriodButton>
        </div>
      </SectionCard>

      <SectionCard title="Top 3" subtitle="Os destaques que dominam a temporada atual.">
        {loading ? (
          <div className="ranking-top-grid">
            {[1, 2, 3].map((position) => (
              <SkeletonPodiumCard key={position} height={248} />
            ))}
          </div>
        ) : topThree.length === 0 ? (
          <EmptyState
            title="Ranking sem dados"
            description="Ainda não há partidas suficientes para montar o pódio deste período."
            hint="Assim que houver registros, os destaques aparecem aqui."
          />
        ) : (
          <div className="ranking-top-grid">
            {topThree.map((item, index) => {
              const podium = podiumMeta[index] || podiumMeta[2];
              return (
                <div
                  key={item.discordId}
                  style={{
                    borderRadius: 24,
                    padding: 20,
                    border: `1px solid ${podium.border}`,
                    background: podium.bg,
                    boxShadow: `0 18px 42px ${podium.glow}`,
                    display: "grid",
                    gap: 12,
                    minHeight: 248,
                    transition: "transform 180ms ease, box-shadow 180ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${podium.border}`,
                        background: "rgba(255,255,255,0.04)",
                        color: podium.accent,
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {podium.label}
                    </div>

                    <div
                      style={{
                        minWidth: 54,
                        height: 54,
                        borderRadius: 18,
                        display: "grid",
                        placeItems: "center",
                        color: podium.accent,
                        fontSize: 20,
                        fontWeight: 900,
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${podium.border}`,
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 0 24px ${podium.glow}`,
                      }}
                    >
                      #{item.position}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 22,
                        overflow: "hidden",
                        flex: "0 0 auto",
                        background: getAvatarGradient(item.position, podium.accent),
                        border: `1px solid ${podium.border}`,
                        boxShadow: `0 0 30px ${podium.glow}`,
                        display: "grid",
                        placeItems: "center",
                        color: "#f8fafc",
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.username}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        getInitials(item.username)
                      )}
                    </div>

                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <div style={{ color: "#f8fafc", fontSize: 20, fontWeight: 900 }}>
                        {item.username}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                        {item.status ? `${item.status} · ` : ""}
                        {formatPlural(item.matches, "partida", "partidas")}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Vitórias</div>
                      <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 900 }}>
                        {formatPlural(item.wins, "vitória", "vitórias")}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 18,
                        background: "rgba(34,211,238,0.06)",
                        border: "1px solid rgba(34,211,238,0.10)",
                      }}
                    >
                      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Participações</div>
                      <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 900 }}>
                        {formatPlural(item.matches, "partida", "partidas")}
                      </div>
                    </div>
                  </div>

                  {formatCurrency(item.earnedValue) ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: "rgba(34,211,238,0.08)",
                        border: "1px solid rgba(34,211,238,0.14)",
                        color: "#cffafe",
                        fontSize: 13,
                        fontWeight: 800,
                        display: "inline-flex",
                        width: "fit-content",
                      }}
                    >
                      Valor ganho total: {formatCurrency(item.earnedValue)}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "#94a3b8",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "inline-flex",
                        width: "fit-content",
                      }}
                    >
                      Valor ganho total indisponível neste contrato
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {selfOutsideTop99 ? (
        <SectionCard
          title="Você"
          subtitle="Seu destaque atual fora do Top 99."
          style={{
            borderColor: "rgba(34,211,238,0.32)",
            boxShadow: "0 20px 60px rgba(34,211,238,0.08)",
          }}
        >
          <LeaderboardCard item={selfItem} variant="self" highlight />
        </SectionCard>
      ) : null}

      <SectionCard title="Posições 4 a 99" subtitle="Lista detalhada em formato de cards, com melhor leitura e hierarquia.">
        {loading ? (
          <div className="ranking-list-grid">
            {[1, 2, 3, 4, 5].map((row) => (
              <SkeletonListItem key={row} />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <EmptyState
            title="Nenhum jogador ranqueado"
            description="Não foi possível localizar registros para este período."
            hint="Verifique outro período ou aguarde novas partidas."
          />
        ) : (
          <div className="ranking-list-wrap">
            <div className="ranking-list-grid">
              {rest.map((item) => (
                <LeaderboardCard key={`${item.discordId}-${item.position}`} item={item} compact />
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}