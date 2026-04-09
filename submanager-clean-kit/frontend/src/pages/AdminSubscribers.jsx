import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import AppShell from "../layouts/AppShell";

function getUsersList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function SectionCard({ title, subtitle, children, action }) {
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
      {(title || subtitle || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            {title ? (
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
            ) : null}

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

          {action ? <div>{action}</div> : null}
        </div>
      )}

      {children}
    </section>
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

function UserCard({ item }) {
  const displayName = item.username || item.name || item.email || "Usuário";
  const role = item.role || "—";

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
          {item.email || "Sem e-mail"}
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
          color: role === "OWNER" ? "#c7d2fe" : "#bbf7d0",
          background:
            role === "OWNER"
              ? "rgba(99,102,241,0.12)"
              : "rgba(34,197,94,0.10)",
          border:
            role === "OWNER"
              ? "1px solid rgba(99,102,241,0.22)"
              : "1px solid rgba(34,197,94,0.18)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {role}
      </div>
    </div>
  );
}

export default function AdminSubscribers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const response = await api.get("/users");
        const users = getUsersList(response);
        setItems(
          users.filter(
            (user) => user?.role === "ADMIN" || user?.role === "OWNER"
          )
        );
      } catch (err) {
        setItems([]);
        setError(
          err?.response?.data?.message ||
            "Não foi possível carregar os usuários administrativos."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const adminCount = items.filter((item) => item?.role === "ADMIN").length;
  const ownerCount = items.filter((item) => item?.role === "OWNER").length;

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <style>{`
          .admin-users-stats-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .admin-users-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          @media (max-width: 1180px) {
            .admin-users-stats-grid,
            .admin-users-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 860px) {
            .admin-users-stats-grid,
            .admin-users-grid {
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
              Administração
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
              Usuários administrativos
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
              Tela baseada nos usuários retornados pela API atual.
            </p>
          </div>
        </section>

        <div className="admin-users-stats-grid">
          <StatCard title="Total" value={loading ? "..." : items.length} />
          <StatCard title="Admins" value={loading ? "..." : adminCount} accent="success" />
          <StatCard title="Owners" value={loading ? "..." : ownerCount} accent="neutral" />
        </div>

        <SectionCard
          title="Lista de usuários"
          subtitle="Usuários com role ADMIN ou OWNER retornados por /users."
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
            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
              }}
            >
              Carregando usuários...
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nenhum usuário encontrado"
              description="Nenhum usuário ADMIN ou OWNER foi retornado pela API."
            />
          ) : (
            <div className="admin-users-grid">
              {items.map((item) => (
                <UserCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}