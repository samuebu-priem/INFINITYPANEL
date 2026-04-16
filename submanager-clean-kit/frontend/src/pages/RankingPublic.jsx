import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/auth.jsx";

export default function RankingPublic() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get("/rankings/mediators");
      setRanking(res?.data || res || []);
    } catch {
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: "#9ca3af" }}>Carregando ranking...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <style>{`
        .rank-card {
          transition: all 0.25s ease;
        }

        .rank-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        }

        .gold-glow {
          animation: goldPulse 2s infinite alternate;
        }

        @keyframes goldPulse {
          from {
            box-shadow: 0 0 20px rgba(255,215,0,0.4);
          }
          to {
            box-shadow: 0 0 40px rgba(255,215,0,0.9);
          }
        }
      `}</style>

      {/* 🔥 TOP 3 */}
      <div style={{ display: "grid", gap: 16 }}>
        {ranking.slice(0, 3).map((userRank, index) => {
          const isGold = index === 0;

          return (
            <div
              key={userRank.userId}
              className={`rank-card ${isGold ? "gold-glow" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: 20,
                borderRadius: 22,
                background:
                  index === 0
                    ? "linear-gradient(135deg, #FFD700, #FFB800)"
                    : index === 1
                    ? "linear-gradient(135deg, #C0C0C0, #9CA3AF)"
                    : "linear-gradient(135deg, #CD7F32, #92400E)",
                color: "#000",
              }}
            >
              {/* POSIÇÃO */}
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                #{userRank.position}
              </div>

              {/* AVATAR */}
              <img
                src={userRank.avatarUrl || "https://via.placeholder.com/60"}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: "3px solid rgba(0,0,0,0.3)",
                }}
              />

              {/* INFO */}
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {userRank.username}
                </div>

                <div style={{ fontSize: 13 }}>
                  {userRank.status || "Sem status"}
                </div>
              </div>

              {/* STATS */}
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div>💰 {userRank.totalRevenue}</div>
                <div>🎮 {userRank.matches}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🧊 RESTO */}
      <div
        style={{
          display: "grid",
          gap: 10,
          maxHeight: 500,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {ranking.slice(3).map((userRank) => {
          const isCurrentUser = user?.id === userRank.userId;

          return (
            <div
              key={userRank.userId}
              className="rank-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 14,
                borderRadius: 16,
                background: isCurrentUser ? "#1e293b" : "#111827",
                border: isCurrentUser
                  ? "1px solid #22c55e"
                  : "1px solid #1f2937",
              }}
            >
              {/* POS */}
              <div style={{ width: 40, fontWeight: 800 }}>
                #{userRank.position}
              </div>

              {/* AVATAR */}
              <img
                src={userRank.avatarUrl || "https://via.placeholder.com/40"}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                }}
              />

              {/* INFO */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {userRank.username}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  {userRank.status || "Sem status"}
                </div>
              </div>

              {/* STATS */}
              <div style={{ textAlign: "right", fontSize: 13 }}>
                <div>💰 {userRank.totalRevenue}</div>
                <div>🎮 {userRank.matches}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 👤 USUÁRIO DESTACADO */}
      {user && (
        <div
          style={{
            marginTop: 10,
            padding: 16,
            borderRadius: 20,
            background: "#020617",
            border: "1px solid #22c55e",
            textAlign: "center",
          }}
        >
          <strong>Seu ranking:</strong>{" "}
          {ranking.find((r) => r.userId === user.id)?.position || "—"}
        </div>
      )}
    </div>
  );
}