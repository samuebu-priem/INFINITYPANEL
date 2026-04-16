import { useEffect, useState } from "react";
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
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 14px 44px rgba(0,0,0,0.26)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top right, rgba(34,211,238,0.08), transparent 32%), radial-gradient(circle at bottom left, rgba(99,102,241,0.08), transparent 28%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f8fafc" }}>
          {title}
        </h2>
        {subtitle ? (
          <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
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

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function SkeletonRow() {
  return (
    <div
      style={{
        height: 76,
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

export default function AdminMediatorRanking() {
  const [period, setPeriod] = useState("total");
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rankings/mediators?period=${period}`);
        setRanking(getRankingList(response));
      } catch {
        setRanking([]);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [period]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .ranking-periods {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ranking-list-grid {
          display: grid;
          gap: 12px;
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

        @keyframes rankingShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <SectionCard
        title="Ranking de mediadores"
        subtitle="Disponível apenas para Admin e Owner."
      >
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

      <SectionCard
        title="Mediadores com mais lucro"
        subtitle="Lucro e filas intermediadas."
      >
        {loading ? (
          <div className="ranking-list-grid">
            {[1, 2, 3, 4, 5].map((row) => (
              <SkeletonRow key={row} />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <EmptyState
            title="Nenhum dado encontrado"
            description="Ainda não há informações suficientes para montar este ranking neste período."
            hint="Tente outro período ou aguarde novos registros."
          />
        ) : (
          <div className="ranking-list-grid">
            {ranking.map((item) => (
              <div
                key={`${item.mediatorId}-${item.position}`}
                className="ranking-row"
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ color: "#22d3ee", fontWeight: 900, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    #{item.position}
                  </div>
                  <div style={{ color: "#f8fafc", fontWeight: 900, marginTop: 0, fontSize: 16 }}>
                    {item.mediatorName}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>
                    ID: {item.mediatorId}
                  </div>
                </div>

                <div style={{ textAlign: "right", marginLeft: "auto" }}>
                  <div style={{ color: "#86efac", fontWeight: 900, fontSize: 18 }}>
                    {formatPrice(item.totalRevenue)}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                    {item.matches} fila(s) intermediada(s)
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