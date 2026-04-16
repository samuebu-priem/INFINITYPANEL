import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function getRankingList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.ranking)) return response.ranking;
  if (Array.isArray(response?.data?.ranking)) return response.data.ranking;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function SectionCard({ title, subtitle, children }) {
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

function SkeletonCard({ height = 74 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(34,211,238,0.06) 50%, rgba(255,255,255,0.03) 100%)",
        backgroundSize: "200% 100%",
        animation: "rankingShimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export default function RankingPublic() {
  const [period, setPeriod] = useState("total");
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rankings/public?period=${period}`);
        setRanking(getRankingList(response));
      } catch {
        setRanking([]);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [period]);

  const topThree = useMemo(() => ranking.slice(0, 3), [ranking]);

  const podiumMeta = [
    {
      label: "Coroa",
      border: "rgba(251,191,36,0.34)",
      bg: "linear-gradient(180deg, rgba(251,191,36,0.14) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fbbf24",
      glow: "rgba(251,191,36,0.22)",
      badgeBg: "rgba(251,191,36,0.12)",
    },
    {
      label: "Prata",
      border: "rgba(148,163,184,0.30)",
      bg: "linear-gradient(180deg, rgba(148,163,184,0.10) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#e2e8f0",
      glow: "rgba(148,163,184,0.18)",
      badgeBg: "rgba(148,163,184,0.10)",
    },
    {
      label: "Bronze",
      border: "rgba(180,83,9,0.30)",
      bg: "linear-gradient(180deg, rgba(180,83,9,0.12) 0%, rgba(7,10,16,0.98) 100%)",
      accent: "#fdba74",
      glow: "rgba(180,83,9,0.18)",
      badgeBg: "rgba(180,83,9,0.10)",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .ranking-top-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
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

        .ranking-row {
          position: relative;
          overflow: hidden;
          border: 1px solid #1f2937;
          border-radius: 18px;
          background: rgba(255,255,255,0.02);
          padding: 16px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .ranking-row:hover {
          transform: translateY(-2px);
          border-color: rgba(34,211,238,0.22);
          box-shadow: 0 14px 28px rgba(0,0,0,0.18);
          background: rgba(255,255,255,0.03);
        }

        .ranking-row::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(34,211,238,0.08), transparent 40%);
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .ranking-row:hover::before {
          opacity: 1;
        }

        .ranking-podium-card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 20px;
          display: grid;
          gap: 12px;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
          min-height: 216px;
        }

        .ranking-podium-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at top right, rgba(34,211,238,0.10), transparent 28%);
        }

        .ranking-podium-card:hover {
          transform: translateY(-3px);
        }

        @keyframes rankingShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 980px) {
          .ranking-top-grid {
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

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
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
            Ranking de vitórias
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              color: "#94a3b8",
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 740,
            }}
          >
            Veja os jogadores com mais vitórias na org em diferentes períodos.
          </p>
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
              <SkeletonCard key={position} height={224} />
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
              const placeLabel = index === 0 ? "1º lugar" : index === 1 ? "2º lugar" : "3º lugar";

              return (
                <div
                  key={item.discordId}
                  className="ranking-podium-card"
                  style={{
                    border: `1px solid ${podium.border}`,
                    background: podium.bg,
                    boxShadow: `0 18px 42px ${podium.glow}`,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.boxShadow = `0 26px 56px ${podium.glow}`;
                    event.currentTarget.style.borderColor = podium.border;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.boxShadow = `0 18px 42px ${podium.glow}`;
                    event.currentTarget.style.borderColor = podium.border;
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        width: "fit-content",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${podium.border}`,
                        background: podium.badgeBg,
                        color: podium.accent,
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {placeLabel}
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

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>
                      {item.username}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>
                      {item.matches} partida(s) · presença competitiva
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ color: "#86efac", fontSize: 24, fontWeight: 900 }}>
                      {item.wins}
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>
                      vitória(s)
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      width: "fit-content",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(34,211,238,0.08)",
                      border: "1px solid rgba(34,211,238,0.16)",
                      color: "#cffafe",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Elite da comunidade
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ranking completo" subtitle="Lista dos jogadores com mais vitórias.">
        {loading ? (
          <div className="ranking-list-grid">
            {[1, 2, 3, 4, 5].map((row) => (
              <SkeletonCard key={row} />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <EmptyState
            title="Nenhum jogador ranqueado"
            description="Não foi possível localizar registros para este período."
            hint="Verifique outro período ou aguarde novas partidas."
          />
        ) : (
          <div className="ranking-list-grid">
            {ranking.map((item) => (
              <div
                key={`${item.discordId}-${item.position}`}
                className="ranking-row"
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div
                      style={{
                        color: "#22d3ee",
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      #{item.position}
                    </div>
                    <div
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(99,102,241,0.20)",
                        background: "rgba(99,102,241,0.08)",
                        color: "#c7d2fe",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      Competitivo
                    </div>
                  </div>
                  <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 16 }}>
                    {item.username}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>
                    {item.matches} partida(s) · presença pública
                  </div>
                </div>

                <div style={{ textAlign: "right", marginLeft: "auto" }}>
                  <div style={{ color: "#86efac", fontWeight: 900, fontSize: 18 }}>
                    {item.wins} vitória(s)
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Contribuição atual
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}