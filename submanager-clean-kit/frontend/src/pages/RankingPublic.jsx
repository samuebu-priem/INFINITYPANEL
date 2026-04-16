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

  const status =
    item?.status ?? item?.title ?? item?.rankTitle ?? item?.role ?? null;
  const avatar =
    item?.avatar ??
    item?.avatarUrl ??
    item?.photoUrl ??
    item?.imageUrl ??
    item?.profileImage ??
    null;
  const matches = Number(item?.matches ?? item?.partidas ?? item?.games ?? 0);
  const wins = Number(
    item?.wins ?? item?.vitórias ?? item?.vitorias ?? item?.victories ?? 0
  );
  const earnedValue =
    item?.earnedValue ??
    item?.totalRevenue ??
    item?.valorGanho ??
    item?.valorGanhoTotal ??
    item?.totalEarned ??
    null;

  return {
    raw: item,
    position,
    username,
    status,
    avatar,
    matches,
    wins,
    earnedValue:
      earnedValue !== null && earnedValue !== undefined && earnedValue !== ""
        ? earnedValue
        : null,
    discordId: item?.discordId ?? item?.id ?? `${position}-${username}`,
  };
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "R$ 0,00";
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
  return (
    String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
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
        border: active
          ? "1px solid rgba(34,211,238,0.45)"
          : "1px solid #1f2937",
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

function Avatar({ avatar, username, position, accent }) {
  return (
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 22,
        overflow: "hidden",
        flex: "0 0 auto",
        background:
          position === 1
            ? "linear-gradient(180deg, rgba(251,191,36,0.26), rgba(17,24,39,0.96))"
            : position === 2
            ? "linear-gradient(180deg, rgba(226,232,240,0.18), rgba(17,24,39,0.96))"
            : position === 3
            ? "linear-gradient(180deg, rgba(251,146,60,0.20), rgba(17,24,39,0.96))"
            : `linear-gradient(180deg, ${accent}26, rgba(17,24,39,0.96))`,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 0 28px ${accent}33`,
        display: "grid",
        placeItems: "center",
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: 900,
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        getInitials(username)
      )}
    </div>
  );
}

function StatPill({ label, value, accent = "neutral" }) {
  const styles = {
    neutral: {
      bg: "rgba(255,255,255,0.03)",
      border: "rgba(255,255,255,0.06)",
      text: "#e5e7eb",
    },
    green: {
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.16)",
      text: "#86efac",
    },
    cyan: {
      bg: "rgba(34,211,238,0.08)",
      border: "rgba(34,211,238,0.16)",
      text: "#a5f3fc",
    },
    gold: {
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.16)",
      text: "#fde68a",
    },
  };

  const theme = styles[accent] || styles.neutral;

  return (
    <div
      style={{
        borderRadius: 18,
        padding: "12px 14px",
        border: `1px solid ${theme.border}`,
        background: theme.bg,
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: theme.text,
          fontSize: 17,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatsBlock({ item }) {
  const currency = formatCurrency(item.earnedValue);
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      }}
    >
      <StatPill
        label="Vitórias"
        value={formatPlural(item.wins, "vitória", "vitórias")}
        accent="green"
      />
      <StatPill
        label="Partidas"
        value={formatPlural(item.matches, "partida", "partidas")}
        accent="cyan"
      />
      <StatPill label="Lucro total" value={currency} accent="gold" />
    </div>
  );
}

function UserCard({ item }) {
  return (
    <SectionCard
      title="Seu lugar no ranking"
      subtitle="Veja sua posição atual na Infinity."
      style={{
        borderColor: "rgba(34,211,238,0.30)",
        boxShadow: "0 22px 70px rgba(34,211,238,0.08)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "auto minmax(0, 1fr)",
          alignItems: "start",
        }}
      >
        <Avatar
          avatar={item.avatar}
          username={item.username}
          position={item.position}
          accent="#22d3ee"
        />

        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <div
              style={{
                color: "#f8fafc",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              {item.username}
            </div>

            <div
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(34,211,238,0.10)",
                border: "1px solid rgba(34,211,238,0.18)",
                color: "#cffafe",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Top #{item.position}
            </div>

            {item.status ? (
              <div
                style={{
                  padding: "7px 10px",
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
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 760,
            }}
          >
            Seu card mostra sua posição, seu desempenho e o quanto você acumulou.
          </div>

          <StatsBlock item={item} />
        </div>
      </div>
    </SectionCard>
  );
}

function PodiumCard({ item, rank, meta }) {
  const variantLabel = rank === 1 ? "🥇 Top 1" : rank === 2 ? "🥈 Top 2" : "🥉 Top 3";

  return (
    <div
      style={{
        borderRadius: 28,
        padding: 22,
        border: `1px solid ${meta.border}`,
        background: meta.bg,
        boxShadow: `0 24px 70px ${meta.glow}`,
        display: "grid",
        gap: 16,
        minHeight: meta.height,
        transform: rank === 1 ? "translateY(-10px) scale(1.02)" : "none",
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
            border: `1px solid ${meta.border}`,
            background: "rgba(255,255,255,0.04)",
            color: meta.accent,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {variantLabel}
        </div>

        <div
          style={{
            minWidth: 54,
            height: 54,
            borderRadius: 18,
            display: "grid",
            placeItems: "center",
            color: meta.accent,
            fontSize: 20,
            fontWeight: 900,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${meta.border}`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 0 26px ${meta.glow}`,
          }}
        >
          #{item.position}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar
          avatar={item.avatar}
          username={item.username}
          position={item.position}
          accent={meta.accent}
        />

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

      <StatsBlock item={item} />
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

  const userKey =
    user?.discordId ?? user?.id ?? user?.username ?? user?.nickname ?? null;

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
      border: "rgba(251,191,36,0.42)",
      bg: "linear-gradient(180deg, rgba(251,191,36,0.18) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fbbf24",
      glow: "rgba(251,191,36,0.28)",
      height: 324,
    },
    {
      border: "rgba(203,213,225,0.38)",
      bg: "linear-gradient(180deg, rgba(203,213,225,0.12) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#e2e8f0",
      glow: "rgba(203,213,225,0.22)",
      height: 286,
    },
    {
      border: "rgba(251,146,60,0.36)",
      bg: "linear-gradient(180deg, rgba(251,146,60,0.14) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fb923c",
      glow: "rgba(251,146,60,0.20)",
      height: 286,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .ranking-top-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1.08fr 1fr;
          align-items: end;
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

        @media (max-width: 1100px) {
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
              "radial-gradient(circle at 84% 16%, rgba(34,211,238,0.18), transparent 22%), radial-gradient(circle at 15% 22%, rgba(99,102,241,0.14), transparent 24%)",
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
                Top da Infinity
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
                Veja quem está no topo, compare vitórias, partidas e lucro total
                e acompanhe sua posição dentro da comunidade.
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
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Destaque da org
              </div>
              <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>
                Quem está dominando a Infinity agora?
              </div>
              <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                Um jeito mais bonito de acompanhar o topo da comunidade.
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Período" subtitle="Escolha o momento que você quer ver.">
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

      {selfItem ? <UserCard item={selfItem} /> : null}

      <SectionCard title="Pódio" subtitle="Os três nomes que estão na frente agora.">
        {loading ? (
          <div className="ranking-top-grid">
            {[1, 2, 3].map((position) => (
              <SkeletonPodiumCard
                key={position}
                height={position === 1 ? 324 : 286}
              />
            ))}
          </div>
        ) : topThree.length === 0 ? (
          <EmptyState
            title="Ainda não tem pódio"
            description="Assim que a comunidade movimentar esse período, o topo aparece aqui."
            hint="Volte daqui a pouco para acompanhar."
          />
        ) : (
          <div className="ranking-top-grid">
            {[
              { item: topThree[2], meta: podiumMeta[2], rank: 3 },
              { item: topThree[0], meta: podiumMeta[0], rank: 1 },
              { item: topThree[1], meta: podiumMeta[1], rank: 2 },
            ].map(({ item, meta, rank }, index) => {
              if (!item) return <div key={`empty-${index}`} />;
              return <PodiumCard key={item.discordId} item={item} rank={rank} meta={meta} />;
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Top 4 ao 99"
        subtitle="A lista completa de quem está correndo atrás do topo."
      >
        {loading ? (
          <div className="ranking-list-grid">
            {[1, 2, 3, 4, 5].map((row) => (
              <SkeletonListItem key={row} />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <EmptyState
            title="Ainda não tem jogadores no ranking"
            description="Quando começarem a entrar resultados, a lista aparece aqui."
            hint="Tente outro período ou volte mais tarde."
          />
        ) : (
          <div className="ranking-list-wrap">
            <div className="ranking-list-grid">
              {rest.map((item) => (
                <div
                  key={`${item.discordId}-${item.position}`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 24,
                    padding: 18,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(7,10,16,0.98) 100%)",
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      background:
                        "radial-gradient(circle at top right, rgba(34,211,238,0.06), transparent 26%)",
                    }}
                  />

                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 18,
                          display: "grid",
                          placeItems: "center",
                          color: "#67e8f9",
                          fontWeight: 900,
                          border: "1px solid rgba(34,211,238,0.16)",
                          background: "rgba(34,211,238,0.06)",
                          flex: "0 0 auto",
                          boxShadow: "0 0 22px rgba(34,211,238,0.12)",
                        }}
                      >
                        #{item.position}
                      </div>

                      <Avatar
                        avatar={item.avatar}
                        username={item.username}
                        position={item.position}
                        accent="#22d3ee"
                      />

                      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                        <div style={{ color: "#f8fafc", fontSize: 17, fontWeight: 900 }}>
                          {item.username}
                        </div>
                        {item.status ? (
                          <div
                            style={{
                              width: "fit-content",
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
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        color: "#22d3ee",
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      {formatPlural(item.wins, "vitória", "vitórias")}
                    </div>
                  </div>

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <StatsBlock item={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}