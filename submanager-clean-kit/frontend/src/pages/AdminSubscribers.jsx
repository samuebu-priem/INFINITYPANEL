import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function normalizeOverview(response) {
  if (!response) return { staff: [], clients: [] };
  if (response.staff || response.clients) {
    return {
      staff: Array.isArray(response.staff) ? response.staff : [],
      clients: Array.isArray(response.clients) ? response.clients : [],
    };
  }

  if (response.data?.staff || response.data?.clients) {
    return {
      staff: Array.isArray(response.data.staff) ? response.data.staff : [],
      clients: Array.isArray(response.data.clients) ? response.data.clients : [],
    };
  }

  return { staff: [], clients: [] };
}

function isClientOnline(client) {
  if (client?.isOnline === true) return true;

  const subscription = client?.subscription || null;
  if (!subscription) return false;

  if (subscription?.isActive === true) return true;

  const status = String(subscription?.status || "").toUpperCase();
  if (status === "ACTIVE") return true;

  const endsAt = subscription?.endsAt;
  if (endsAt) {
    const endDate = new Date(endsAt);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() > Date.now()) {
      return true;
    }
  }

  return false;
}

function getDisplayName(user) {
  return user?.username || user?.name || user?.email || "Usuário";
}

function getPlanName(client) {
  return (
    client?.subscription?.plan?.name ||
    client?.subscription?.planName ||
    "Sem plano"
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            color: "#f3f4f6",
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function StatCard({ title, value, accent = "primary" }) {
  const themes = {
    primary: {
      chip: "rgba(99, 102, 241, 0.14)",
      border: "rgba(99, 102, 241, 0.30)",
      glow: "0 0 30px rgba(99, 102, 241, 0.16)",
      dot: "#6366f1",
    },
    success: {
      chip: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.24)",
      glow: "0 0 30px rgba(34, 197, 94, 0.12)",
      dot: "#22c55e",
    },
    neutral: {
      chip: "rgba(148, 163, 184, 0.10)",
      border: "rgba(148, 163, 184, 0.18)",
      glow: "0 0 24px rgba(148, 163, 184, 0.08)",
      dot: "#94a3b8",
    },
    danger: {
      chip: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.24)",
      glow: "0 0 30px rgba(239, 68, 68, 0.12)",
      dot: "#ef4444",
    },
  };

  const theme = themes[accent] || themes.primary;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 20,
        boxShadow: theme.glow,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: theme.chip,
          color: "#cbd5e1",
          fontSize: 12,
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: theme.dot,
            boxShadow: `0 0 12px ${theme.dot}`,
          }}
        />
        {title}
      </div>

      <div
        style={{
          color: "#f3f4f6",
          fontSize: 32,
          lineHeight: 1.05,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(99, 102, 241, 0.22)",
        borderRadius: 24,
        padding: 28,
        textAlign: "center",
        background:
          "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(11,15,20,0.4) 100%)",
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          margin: "0 auto 14px",
          background: "rgba(99, 102, 241, 0.12)",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          color: "#c7d2fe",
          boxShadow: "0 0 30px rgba(99,102,241,0.18)",
        }}
      >
        ✦
      </div>

      <h3
        style={{
          margin: 0,
          color: "#f3f4f6",
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "10px auto 0",
          maxWidth: 480,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function StaffCard({ user }) {
  const displayName = getDisplayName(user);

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        padding: 20,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            color: "#f3f4f6",
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1.25,
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            marginTop: 8,
            color: "#9ca3af",
            fontSize: 14,
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {user.email || "Sem e-mail"}
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: user?.role === "OWNER" ? "#c7d2fe" : "#bbf7d0",
          background:
            user?.role === "OWNER"
              ? "rgba(99,102,241,0.12)"
              : "rgba(34,197,94,0.10)",
          border:
            user?.role === "OWNER"
              ? "1px solid rgba(99,102,241,0.22)"
              : "1px solid rgba(34,197,94,0.18)",
        }}
      >
        {user?.role || "STAFF"}
      </div>
    </div>
  );
}

function ClientCard({ user }) {
  const displayName = getDisplayName(user);
  const online = isClientOnline(user);

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(11,15,20,0.98) 100%)",
        padding: 20,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            color: "#f3f4f6",
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1.25,
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            marginTop: 8,
            color: "#9ca3af",
            fontSize: 14,
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {user.email || "Sem e-mail"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
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
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: online ? "#86efac" : "#d1d5db",
            background: online
              ? "rgba(34,197,94,0.10)"
              : "rgba(148,163,184,0.10)",
            border: online
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(148,163,184,0.18)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: online ? "#22c55e" : "#94a3b8",
              boxShadow: online
                ? "0 0 12px rgba(34,197,94,0.75)"
                : "0 0 10px rgba(148,163,184,0.45)",
            }}
          />
          {online ? "Online" : "Offline"}
        </div>

        <div
          style={{
            color: "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Plano: <strong style={{ color: "#f3f4f6" }}>{getPlanName(user)}</strong>
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: 13,
          }}
        >
          Vence em: {formatDate(user?.subscription?.endsAt)}
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscribers() {
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const response = await api.get("/admin/users-overview");
        const overview = normalizeOverview(response);

        setStaff(overview.staff);
        setClients(overview.clients);
      } catch (err) {
        setStaff([]);
        setClients([]);
        setError(
          err?.message || "Não foi possível carregar a visão geral dos usuários."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onlineClients = useMemo(
    () => clients.filter(isClientOnline).length,
    [clients]
  );
  const offlineClients = useMemo(
    () => clients.length - onlineClients,
    [clients, onlineClients]
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .admin-overview-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .admin-overview-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .admin-overview-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .admin-overview-stats-grid,
          .admin-overview-grid {
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
            Visão geral
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
            Staff e clientes
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
            Controle de clientes e Staff retornam (Assinatura com status
            de online ou offline.)
          </p>
        </div>
      </section>

      <div className="admin-overview-stats-grid">
        <StatCard title="Staff" value={loading ? "..." : staff.length} />
        <StatCard
          title="Clientes"
          value={loading ? "..." : clients.length}
          accent="neutral"
        />
        <StatCard
          title="Online"
          value={loading ? "..." : onlineClients}
          accent="success"
        />
        <StatCard
          title="Offline"
          value={loading ? "..." : offlineClients}
          accent="danger"
        />
      </div>

      <SectionCard
        title="Staff"
        subtitle="Owner e Admin retornados pela visão geral."
      >
        {error ? (
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              borderRadius: 18,
              border: "1px solid rgba(239,68,68,0.22)",
              background: "rgba(239,68,68,0.08)",
              color: "#fecaca",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 14 }}>Carregando staff...</div>
        ) : staff.length === 0 ? (
          <EmptyState
            title="Nenhum staff encontrado"
            description="Nenhum usuário OWNER ou ADMIN foi retornado."
          />
        ) : (
          <div className="admin-overview-grid">
            {staff.map((item) => (
              <StaffCard key={item.id} user={item} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Clientes"
        subtitle="Players com status visual da assinatura."
      >
        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            Carregando clientes...
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Nenhum usuário PLAYER foi retornado."
          />
        ) : (
          <div className="admin-overview-grid">
            {clients.map((item) => (
              <ClientCard key={item.id} user={item} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}