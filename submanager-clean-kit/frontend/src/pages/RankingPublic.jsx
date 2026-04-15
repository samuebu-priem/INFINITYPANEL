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
        border: "1px solid #1f2937",
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f3f4f6" }}>
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

  return (
    <div style={{ display: "grid", gap: 20 }}>
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

      <SectionCard
        title="Período"
        subtitle="Escolha a janela de tempo do ranking."
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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

      <SectionCard
        title="Top 3"
        subtitle="Os destaques atuais do ranking."
      >
        {loading ? (
          <div style={{ color: "#9ca3af" }}>Carregando ranking...</div>
        ) : topThree.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Nenhum dado encontrado.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            {topThree.map((item) => (
              <div
                key={item.discordId}
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 24,
                  background:
                    "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
                  padding: 20,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ color: "#818cf8", fontWeight: 900 }}>
                  #{item.position}
                </div>
                <div style={{ color: "#f3f4f6", fontSize: 18, fontWeight: 800 }}>
                  {item.username}
                </div>
                <div style={{ color: "#86efac", fontSize: 20, fontWeight: 900 }}>
                  {item.wins} vitória(s)
                </div>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>
                  {item.matches} partida(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Ranking completo"
        subtitle="Lista dos jogadores com mais vitórias."
      >
        {loading ? (
          <div style={{ color: "#9ca3af" }}>Carregando ranking...</div>
        ) : ranking.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Nenhum dado encontrado.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
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