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

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
      <SectionCard
        title="Ranking de mediadores"
        subtitle="Disponível apenas para Admin e Owner."
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
        title="Mediadores com mais lucro"
        subtitle="Lucro e filas intermediadas."
      >
        {loading ? (
          <div style={{ color: "#9ca3af" }}>Carregando ranking...</div>
        ) : ranking.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Nenhum dado encontrado.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {ranking.map((item) => (
              <div
                key={`${item.mediatorId}-${item.position}`}
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
                    {item.mediatorName}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
                    ID: {item.mediatorId}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#86efac", fontWeight: 900 }}>
                    {formatPrice(item.totalRevenue)}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
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