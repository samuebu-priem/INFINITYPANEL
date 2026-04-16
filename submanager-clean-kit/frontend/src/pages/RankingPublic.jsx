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
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        border: "1px solid rgba(99,102,241,0.14)",
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 18px 48px rgba(0,0,0,0.28)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.24)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.22)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.14)";
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f3f4f6", letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {subtitle ? (
          <p style={{ margin: "8px 0 0", color: "#9ca3af", fontSize: 14, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
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
          ? "1px solid rgba(99,102,241,0.45)"
          : "1px solid #1f2937",
        background: active
          ? "rgba(99,102,241,0.14)"
          : "rgba(255,255,255,0.03)",
        color: active ? "#c7d2fe" : "#e5e7eb",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        transition: "transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
        event.currentTarget.style.boxShadow = active ? "0 10px 24px rgba(99,102,241,0.16)" : "0 10px 24px rgba(0,0,0,0.16)";
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
      rank: 1,
      border: "rgba(251,191,36,0.32)",
      bg: "linear-gradient(180deg, rgba(251,191,36,0.12) 0%, rgba(11,15,20,0.98) 100%)",
      accent: "#fbbf24",
      glow: "rgba(251,191,36,0.20)",
    },
    {
      rank: 2,
      border: "rgba(148,163,184,0.28)",
      bg: "linear-gradient(180deg, rgba(148,163,184,0.10) 0%, rgba(11,15,20,0.98) 100%)",
      accent: "#cbd5e1",
      glow: "rgba(148,163,184,0.18)",
    },
    {
      rank: 3,
      border: "rgba(180,83,9,0.28)",
      bg: "linear-gradient(180deg, rgba(180,83,9,0.10) 0%, rgba(11,15,20,0.98) 100%)",
      accent: "#fdba74",
      glow: "rgba(180,83,9,0.18)",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .ranking-top-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
          borderRadius: 30,
          padding: 28,
          border: "1px solid rgba(99, 102, 241, 0.18)",
          background:
            "linear-gradient(135deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
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

        <div style={{ position: "relative", zIndex: 1 }}>
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
            Ranking público
          </div>

          <h1
            style={{
              margin: 0,
              color: "#f3f4f6",
              fontSize: 36,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            Ranking de vitórias
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

      <SectionCard title="Top 3" subtitle="Os destaques atuais do ranking.">
        {loading ? (
          <div className="ranking-top-grid">
            {[1, 2, 3].map((position) => (
              <div
                key={position}
                style={{
                  minHeight: 208,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.03)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : topThree.length === 0 ? (
          <EmptyState
            title="Ranking sem dados"
            description="Ainda não há partidas suficientes para montar o ranking deste período."
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
                    position: "relative",
                    border: `1px solid ${podium.border}`,
                    borderRadius: 24,
                    background: podium.bg,
                    padding: 20,
                    boxShadow: `0 18px 40px ${podium.glow}`,
                    display: "grid",
                    gap: 10,
                    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = "translateY(-3px)";
                    event.currentTarget.style.boxShadow = `0 24px 50px ${podium.glow}`;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = "translateY(0)";
                    event.currentTarget.style.boxShadow = `0 18px 40px ${podium.glow}`;
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
                      background: "rgba(255,255,255,0.03)",
                      color: podium.accent,
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Posição #{item.position}
                  </div>
                  <div style={{ color: "#f3f4f6", fontSize: 18, fontWeight: 800 }}>
                    {item.username}
                  </div>
                  <div style={{ color: "#86efac", fontSize: 22, fontWeight: 900 }}>
                    {item.wins} vitória(s)
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
                    {item.matches} partida(s)
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
              <div
                key={row}
                style={{
                  height: 74,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.03)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
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
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.02)",
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-2px)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.20)";
                  event.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.18)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.borderColor = "#1f2937";
                  event.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div style={{ color: "#818cf8", fontWeight: 800 }}>
                    #{item.position}
                  </div>
                  <div style={{ color: "#f3f4f6", fontWeight: 800, marginTop: 6 }}>
                    {item.username}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#86efac", fontWeight: 900 }}>
                    {item.wins} vitória(s)
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
                    {item.matches} partida(s)
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
