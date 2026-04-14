import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

function SectionCard({ title, children }) {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #121821 0%, #0b0f14 100%)",
        border: "1px solid #1f2937",
        borderRadius: 24,
        padding: 20,
      }}
    >
      <h2 style={{ color: "#f3f4f6", marginBottom: 16 }}>{title}</h2>
      {children}
    </section>
  );
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

function getRemainingTime(endsAt) {
  if (!endsAt) return "∞";

  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";

  const seconds = Math.floor(diff / 1000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${d}d ${h}h ${m}m ${s}s`;
}

function SubscriptionCard({ sub }) {
  const active = sub.isActive;

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ fontWeight: 800, color: "#f3f4f6", fontSize: 16 }}>
        {sub.plan?.name}
      </div>

      <div style={{ marginTop: 8, color: active ? "#22c55e" : "#ef4444" }}>
        {active ? "ATIVO" : "EXPIRADO"}
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "#9ca3af" }}>
        Tempo restante:
      </div>

      <div style={{ color: "#f3f4f6", fontWeight: 700 }}>
        {getRemainingTime(sub.endsAt)}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
        Início: {formatDate(sub.startsAt)}
      </div>

      <div style={{ fontSize: 12, color: "#9ca3af" }}>
        Fim: {formatDate(sub.endsAt)}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/subscriptions/me");
        setSubscriptions(res?.subscriptions || []);
      } catch {
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Atualiza tempo em tempo real
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((v) => v + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activeCount = useMemo(
    () => subscriptions.filter((s) => s.isActive).length,
    [subscriptions]
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* HEADER */}
      <section
        style={{
          borderRadius: 30,
          padding: 28,
          border: "1px solid rgba(99,102,241,0.2)",
          background:
            "linear-gradient(135deg, rgba(18,24,33,1) 0%, rgba(11,15,20,1) 100%)",
        }}
      >
        <h1 style={{ color: "#f3f4f6", fontSize: 32 }}>
          Perfil de {user?.username}
        </h1>

        <p style={{ color: "#9ca3af" }}>
          Gerencie sua conta e acompanhe seus acessos
        </p>
      </section>

      {/* INFO */}
      <SectionCard title="Informações da conta">
        <div style={{ display: "grid", gap: 8, color: "#cbd5e1" }}>
          <div>Usuário: {user?.username}</div>
          <div>Email: {user?.email}</div>
          <div>Role: {user?.role}</div>
        </div>
      </SectionCard>

      {/* STATUS */}
      <SectionCard title="Status">
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>
              Assinaturas ativas
            </div>
            <div style={{ fontSize: 28, color: "#22c55e" }}>
              {activeCount}
            </div>
          </div>

          <div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>
              Total de planos
            </div>
            <div style={{ fontSize: 28, color: "#f3f4f6" }}>
              {subscriptions.length}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SUBSCRIPTIONS */}
      <SectionCard title="Seus planos">
        {loading ? (
          <div style={{ color: "#9ca3af" }}>Carregando...</div>
        ) : subscriptions.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>
            Você não possui planos ativos.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {subscriptions.map((sub) => (
              <SubscriptionCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}