import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";

function getSubscriptionsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subscriptions)) return response.subscriptions;
  if (Array.isArray(response?.data?.subscriptions)) {
    return response.data.subscriptions;
  }
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getSummaryObject(response) {
  if (!response) return null;
  if (response.summary) return response.summary;
  if (response.data?.summary) return response.data.summary;
  if (response.data) return response.data;
  return response;
}

function getPlanName(subscription) {
  return (
    subscription?.plan?.name ||
    subscription?.plan?.title ||
    subscription?.planName ||
    "Plano ativo"
  );
}

function getEndsAt(subscription) {
  return (
    subscription?.endsAt ||
    subscription?.expiresAt ||
    subscription?.validUntil ||
    subscription?.endDate ||
    null
  );
}

function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (subscription?.isActive === true) return true;

  const status = String(subscription?.status || "").toUpperCase();
  if (status !== "ACTIVE") return false;

  const endsAt = getEndsAt(subscription);
  if (!endsAt) return false;

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() > Date.now();
}

function buildCountdown(endsAt, nowTs) {
  if (!endsAt) return { expired: true, label: "Expirada" };

  const endDate = new Date(endsAt);
  if (Number.isNaN(endDate.getTime())) return { expired: true, label: "Expirada" };

  const diffMs = endDate.getTime() - nowTs;
  if (diffMs <= 0) return { expired: true, label: "Expirada" };

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value, fallback = "0") {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat("pt-BR").format(number);
}

function formatCurrency(value, fallback = "R$ 0,00") {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function getAvatarText(user) {
  const source = String(
    user?.displayName ||
      user?.name ||
      user?.username ||
      user?.email ||
      "U"
  ).trim();

  const first = source.split(/\s+/)[0]?.[0] || "U";
  const second = source.split(/\s+/)[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

function SectionCard({ title, subtitle, children, action, flush = false }) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        border: "1px solid rgba(99,102,241,0.16)",
        borderRadius: 30,
        padding: 24,
        boxShadow: "0 14px 44px rgba(0,0,0,0.24)",
        transition:
          "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = "0 22px 60px rgba(0,0,0,0.30)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.28)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 14px 44px rgba(0,0,0,0.24)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.16)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 35%)",
        }}
      />

      {(title || subtitle || action) && (
        <div
          style={{
            marginBottom: flush ? 14 : 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#f3f4f6",
                  letterSpacing: "-0.03em",
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

            {action ? <div>{action}</div> : null}
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  helpText,
  accent = "primary",
  highlight = false,
}) {
  const accents = {
    primary: {
      value: "#f3f4f6",
      border: "rgba(99,102,241,0.16)",
      bg: "rgba(255,255,255,0.02)",
      glow: "rgba(99,102,241,0.10)",
    },
    success: {
      value: "#86efac",
      border: "rgba(34,197,94,0.18)",
      bg: "rgba(34,197,94,0.06)",
      glow: "rgba(34,197,94,0.16)",
    },
    cyan: {
      value: "#67e8f9",
      border: "rgba(34,211,238,0.18)",
      bg: "rgba(34,211,238,0.06)",
      glow: "rgba(34,211,238,0.16)",
    },
  };

  const theme = accents[accent] || accents.primary;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        borderRadius: 26,
        background: theme.bg,
        padding: 20,
        minHeight: 150,
        boxShadow: highlight ? `0 18px 40px ${theme.glow}` : "none",
        transition:
          "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
        event.currentTarget.style.boxShadow = `0 22px 50px ${theme.glow}`;
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.26)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = highlight
          ? `0 18px 40px ${theme.glow}`
          : "none";
        event.currentTarget.style.borderColor = theme.border;
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08), transparent 42%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: theme.value,
          fontSize: 36,
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 8,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {helpText}
      </div>
    </div>
  );
}

function AccessCard({ subscription, nowTs }) {
  const countdown = buildCountdown(getEndsAt(subscription), nowTs);
  const active = isSubscriptionActive(subscription);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(34,197,94,0.18)",
        borderRadius: 28,
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
        padding: 22,
        boxShadow: "0 18px 42px rgba(0,0,0,0.24)",
        display: "grid",
        gap: 16,
        transition:
          "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 24px 52px rgba(0,0,0,0.30)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.26)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 18px 42px rgba(0,0,0,0.24)";
        event.currentTarget.style.borderColor = "rgba(34,197,94,0.18)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: active
            ? "radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 36%)"
            : "radial-gradient(circle at top right, rgba(239,68,68,0.10), transparent 36%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.16)",
              background: "rgba(34,197,94,0.06)",
              color: "#86efac",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Assinatura ativa
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
            }}
          >
            {getPlanName(subscription)}
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 360,
            }}
          >
            Acesso vinculado à sua conta com validade individual e atualização em
            tempo real.
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: active ? "#86efac" : "#fca5a5",
            background: active
              ? "rgba(34,197,94,0.10)"
              : "rgba(239,68,68,0.10)",
            border: active
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: active ? "#22c55e" : "#ef4444",
              boxShadow: active
                ? "0 0 14px rgba(34,197,94,0.8)"
                : "0 0 12px rgba(239,68,68,0.5)",
            }}
          />
          {active ? "Ativo" : "Expirado"}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(34,197,94,0.18)",
            background: "rgba(34,197,94,0.06)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Tempo restante
          </div>

          <div
            style={{
              color: active ? "#86efac" : "#fca5a5",
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {countdown.label}
          </div>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: "1px solid #1f2937",
            background: "rgba(255,255,255,0.03)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Expira em
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.55,
            }}
          >
            {endsAt ? new Date(endsAt).toLocaleString("pt-BR") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      width="22"
      height="22"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        fill="currentColor"
        d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21h0A105.73 105.73 0 0 0 32.71 96.36a77.7 77.7 0 0 0 6.89-11.27 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.26A105.25 105.25 0 0 0 126.6 80.22c2.64-27.35-4.5-51.08-18.9-72.15ZM42.45 65.69c-6.27 0-11.42-5.71-11.42-12.73S36.06 40.23 42.45 40.23 53.87 45.94 53.76 52.96c0 7.02-5.15 12.73-11.31 12.73Zm42.24 0c-6.27 0-11.42-5.71-11.42-12.73S78.3 40.23 84.69 40.23s11.42 5.71 11.31 12.73c0 7.02-5.04 12.73-11.31 12.73Z"
      />
    </svg>
  );
}

function AvatarPanel({ user }) {
  const [photoHover, setPhotoHover] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 34,
        border: "1px solid rgba(99,102,241,0.20)",
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.99) 100%)",
        boxShadow: "0 20px 54px rgba(0,0,0,0.28)",
        padding: 26,
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 15% 15%, rgba(34,211,238,0.16), transparent 30%), radial-gradient(circle at 85% 0%, rgba(99,102,241,0.18), transparent 28%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(34,211,238,0.10)",
                border: "1px solid rgba(34,211,238,0.18)",
                color: "#a5f3fc",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Identidade
            </div>

            <h2
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 24,
                lineHeight: 1.1,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              Avatar e presença
            </h2>

            <p
              style={{
                margin: "10px 0 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 360,
              }}
            >
              Sua identidade visual no hub Infinity. A área já está preparada para
              foto de perfil e atualização futura sem quebrar o fluxo atual.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(99,102,241,0.18)",
              background: "rgba(255,255,255,0.03)",
              color: "#c7d2fe",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {user?.role || "PLAYER"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 122,
              height: 122,
              borderRadius: 36,
              padding: 4,
              background:
                "linear-gradient(135deg, rgba(34,211,238,0.75), rgba(99,102,241,0.9))",
              boxShadow: "0 18px 44px rgba(34,211,238,0.12)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 32,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgba(17,24,39,0.98), rgba(11,15,20,0.98))",
                display: "grid",
                placeItems: "center",
                color: "#a5f3fc",
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: "-0.06em",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={() => setPhotoHover(true)}
              onMouseLeave={() => setPhotoHover(false)}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background: photoHover
                    ? "radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 48%)"
                    : "radial-gradient(circle at center, rgba(99,102,241,0.08), transparent 48%)",
                  transition: "opacity 180ms ease",
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>
                {getAvatarText(user)}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, flex: 1, minWidth: 220 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                }}
              >
                {user?.username || "Usuário"}
              </div>

              <div
                style={{
                  color: "#c7d2fe",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "7px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(99,102,241,0.20)",
                  background: "rgba(99,102,241,0.08)",
                }}
              >
                Foto não vinculada
              </div>
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 520,
              }}
            >
              Clique na área da foto quando a integração de upload estiver disponível.
              Por enquanto, a interface fica pronta para receber imagem sem alterar o
              backend atual.
            </div>

            <button
              type="button"
              style={{
                width: "fit-content",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                height: 46,
                padding: "0 16px",
                borderRadius: 16,
                border: "1px solid rgba(34,211,238,0.28)",
                background: "rgba(34,211,238,0.08)",
                color: "#cffafe",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 0 22px rgba(34,211,238,0.10)",
              }}
              onClick={(event) => event.preventDefault()}
            >
              Alterar foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileStatusCard({ statusValue, setStatusValue, canPersist, saveMessage }) {
  return (
    <SectionCard
      title="Status personalizado"
      subtitle="Mensagem curta que representa seu momento na comunidade."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 18,
            borderRadius: 22,
            border: "1px solid rgba(99,102,241,0.16)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Status visível
          </div>

          <input
            type="text"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
            placeholder="Ex: Focado na próxima temporada"
            maxLength={80}
            style={{
              height: 56,
              borderRadius: 16,
              border: "1px solid rgba(34,211,238,0.18)",
              background: "rgba(255,255,255,0.03)",
              color: "#f3f4f6",
              padding: "0 16px",
              outline: "none",
              fontSize: 15,
              boxShadow: "0 0 18px rgba(34,211,238,0.05)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            <span>{statusValue ? `${statusValue.length}/80` : "0/80"}</span>
            <span>{canPersist ? "Pronto para salvar" : "Pré-visualização apenas"}</span>
          </div>
        </div>

        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(99,102,241,0.14)",
            background: "rgba(99,102,241,0.06)",
            padding: 16,
            color: "#c7d2fe",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {canPersist
            ? "O status pode ser sincronizado com o perfil usando o contrato existente."
            : "Nenhum contrato seguro de persistência foi encontrado. A interface está pronta, mas este campo permanece apenas visual nesta versão."}
        </div>

        {saveMessage ? (
          <div
            style={{
              color: saveMessage.toLowerCase().includes("sucesso") ? "#86efac" : "#fca5a5",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {saveMessage}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function MetricsOverview({ loadingSummary, profileSummary, activeSubscriptions, nextExpirationCountdown }) {
  const preparedWins = profileSummary?.wins ?? profileSummary?.victories ?? 0;
  const preparedMatches = profileSummary?.matchesPlayed ?? profileSummary?.matches ?? 0;
  const preparedProfit = profileSummary?.mediatorProfitTotal ?? profileSummary?.valueEarned ?? null;
  const preparedMediated = profileSummary?.mediatedMatchesCount ?? profileSummary?.moderatedMatchesCount ?? 0;
  const bestDay = profileSummary?.bestMediatorDay || null;

  return (
    <SectionCard
      title="Resumo da comunidade"
      subtitle="Leitura rápida da sua atividade, acessos e impacto no hub."
    >
      <div className="profile-metrics-grid">
        <StatCard
          label="Assinaturas ativas"
          value={loadingSummary ? "..." : activeSubscriptions.length}
          helpText="Planos válidos no momento."
          accent="success"
          highlight
        />

        <StatCard
          label="Próximo vencimento"
          value={loadingSummary ? "..." : nextExpirationCountdown?.label || "—"}
          helpText="Contagem regressiva da menor validade."
          accent="cyan"
        />

        <StatCard
          label="Vitórias"
          value={loadingSummary ? "..." : formatNumber(preparedWins, "0")}
          helpText="Somente campo confiável do resumo."
        />

        <StatCard
          label="Partidas"
          value={loadingSummary ? "..." : formatNumber(preparedMatches, "0")}
          helpText="Total presente no contrato atual."
        />

        <StatCard
          label="Partidas mediadas"
          value={loadingSummary ? "..." : formatNumber(preparedMediated, "0")}
          helpText="Atuação como mediador, se disponível."
          accent="cyan"
        />

        <StatCard
          label="Lucro do mediador"
          value={loadingSummary ? "..." : formatCurrency(preparedProfit, "R$ 0,00")}
          helpText="Campo exibido somente se enviado pela API."
          accent="success"
        />
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1.1fr 0.9fr",
        }}
      >
        <div
          style={{
            borderRadius: 26,
            border: "1px solid rgba(99,102,241,0.16)",
            background: "rgba(255,255,255,0.02)",
            padding: 18,
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 10,
            }}
          >
            Melhor dia registrado
          </div>

          <div
            style={{
              color: "#f3f4f6",
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            {loadingSummary
              ? "..."
              : bestDay?.date
              ? new Date(`${bestDay.date}T00:00:00`).toLocaleDateString("pt-BR")
              : "—"}
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {bestDay?.amount
              ? `R$ ${Number(bestDay.amount).toFixed(2)} no melhor desempenho.`.replace(
                  ".",
                  ","
                )
              : "Sem referência confiável para esse indicador."}
          </div>
        </div>

        <div
          style={{
            borderRadius: 26,
            border: "1px solid rgba(34,211,238,0.18)",
            background: "linear-gradient(180deg, rgba(34,211,238,0.08), rgba(255,255,255,0.02))",
            padding: 18,
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 10,
            }}
          >
            Leitura rápida
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#cffafe", fontSize: 14, fontWeight: 700 }}>
              {activeSubscriptions.length
                ? `${activeSubscriptions.length} plano(s) ativo(s) agora`
                : "Nenhum plano ativo no momento"}
            </div>
            <div style={{ color: "#c7d2fe", fontSize: 14, lineHeight: 1.7 }}>
              {nextExpirationCountdown?.label
                ? `Validade mais próxima: ${nextExpirationCountdown.label}`
                : "Não há vencimento futuro disponível para exibir."}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [profileSummary, setProfileSummary] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  const [discordIdInput, setDiscordIdInput] = useState("");
  const [savingDiscordId, setSavingDiscordId] = useState(false);
  const [discordMessage, setDiscordMessage] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const hasDiscordSaveContract = true;
  const hasStatusSaveContract = Boolean(
    profileSummary?.canSaveStatus ||
      profileSummary?.supportsStatus ||
      profileSummary?.statusEditable ||
      profileSummary?.statusEndpoint
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscriptions(getSubscriptionsList(response));
      } catch (error) {
        setSubscriptions([]);
        setSubscriptionsError(error?.response?.data?.message || "");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    const loadSummary = async () => {
      try {
        const response = await api.get("/profile/summary");
        const summary = getSummaryObject(response);
        setProfileSummary(summary);
        setDiscordIdInput(summary?.discordId || "");
        setCustomStatus(
          summary?.status ||
            summary?.customStatus ||
            summary?.profileStatus ||
            summary?.bio ||
            ""
        );
      } catch {
        setProfileSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadSubscriptions();
    loadSummary();
  }, []);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(isSubscriptionActive);
  }, [subscriptions]);

  const nextExpiration = useMemo(() => {
    if (!activeSubscriptions.length) return null;

    const sorted = [...activeSubscriptions].sort((a, b) => {
      const aTime = new Date(getEndsAt(a) || 0).getTime();
      const bTime = new Date(getEndsAt(b) || 0).getTime();
      return aTime - bTime;
    });

    return sorted[0] || null;
  }, [activeSubscriptions]);

  const nextExpirationCountdown = useMemo(() => {
    if (!nextExpiration) return null;
    return buildCountdown(getEndsAt(nextExpiration), nowTs);
  }, [nextExpiration, nowTs]);

  const handleSaveDiscordId = async (event) => {
    event.preventDefault();
    setSavingDiscordId(true);
    setDiscordMessage("");

    try {
      const response = await api.patch("/profile/discord", {
        discordId: discordIdInput,
      });

      const savedDiscordId =
        response?.profile?.discordId ||
        response?.data?.profile?.discordId ||
        discordIdInput;

      setProfileSummary((current) => ({
        ...(current || {}),
        discordId: savedDiscordId,
      }));

      setDiscordIdInput(savedDiscordId);
      setDiscordMessage("ID do Discord vinculado com sucesso.");
    } catch (error) {
      setDiscordMessage(
        error?.response?.data?.message ||
          "Não foi possível vincular o ID do Discord."
      );
    } finally {
      setSavingDiscordId(false);
    }
  };

  const handleSaveStatus = async (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (!hasStatusSaveContract) {
      setStatusMessage(
        "Status atualizado apenas na interface. Nenhum contrato seguro para persistência foi detectado."
      );
      return;
    }

    try {
      const response = await api.patch("/profile/status", {
        status: customStatus,
      });

      const savedStatus =
        response?.profile?.status ||
        response?.data?.profile?.status ||
        customStatus;

      setProfileSummary((current) => ({
        ...(current || {}),
        status: savedStatus,
        customStatus: savedStatus,
      }));

      setCustomStatus(savedStatus);
      setStatusMessage("Status atualizado com sucesso.");
    } catch (error) {
      setStatusMessage(
        error?.response?.data?.message ||
          "Não foi possível atualizar o status."
      );
    }
  };

  const displayStatus = profileSummary?.status || profileSummary?.customStatus || customStatus || "Sem status definido";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .profile-top-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.05fr 0.95fr;
        }

        .profile-metrics-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .profile-access-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .profile-discord-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr auto;
          align-items: end;
        }

        @media (max-width: 1180px) {
          .profile-top-grid,
          .profile-metrics-grid,
          .profile-access-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .profile-top-grid,
          .profile-metrics-grid,
          .profile-access-grid,
          .profile-discord-grid {
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
            "linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          boxShadow: "0 22px 72px rgba(0,0,0,0.30)",
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

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ maxWidth: 720 }}>
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
              Seu perfil
            </div>

            <h1
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 40,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: -0.7,
                maxWidth: 780,
              }}
            >
              {user?.username || "Usuário"}
            </h1>

            <p
              style={{
                margin: "14px 0 0",
                color: "#9ca3af",
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 720,
              }}
            >
              Gerencie sua conta, acompanhe seus acessos, veja sua atividade e
              conecte seu Discord com mais clareza.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              minWidth: 260,
            }}
          >
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(34,197,94,0.18)",
                background: "rgba(34,197,94,0.05)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Acessos ativos
              </div>
              <div
                style={{
                  color: "#86efac",
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {loadingSubscriptions ? "..." : activeSubscriptions.length}
              </div>
            </div>

            <div
              style={{
                borderRadius: 20,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.04)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Próxima expiração
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {loadingSubscriptions
                  ? "..."
                  : nextExpirationCountdown?.label || "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-top-grid">
        <AvatarPanel user={user} />
        <ProfileStatusCard
          statusValue={displayStatus}
          setStatusValue={setCustomStatus}
          canPersist={hasStatusSaveContract}
          saveMessage={statusMessage}
        />
      </div>

      <div className="profile-top-grid">
        <SectionCard
          title="Dados da conta"
          subtitle="Informações principais da sua conta."
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.02)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Nome de usuário
              </div>
              <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800 }}>
                {user?.username || "—"}
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.02)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                E-mail
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 16,
                  fontWeight: 800,
                  wordBreak: "break-word",
                }}
              >
                {user?.email || "—"}
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.02)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Conta criada em
              </div>
              <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800 }}>
                {formatDate(user?.createdAt)}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Status da presença"
          subtitle="Leitura rápida da sua identidade e atuação."
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                borderRadius: 26,
                border: "1px solid rgba(99,102,241,0.16)",
                background: "rgba(255,255,255,0.02)",
                padding: 18,
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 10,
                }}
              >
                Seu status
              </div>
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 17,
                  fontWeight: 800,
                  lineHeight: 1.6,
                }}
              >
                {displayStatus}
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                O campo fica preparado visualmente para uma futura persistência,
                sem alterar o contrato atual quando a rota segura não existe.
              </div>
            </div>

            <div
              style={{
                borderRadius: 26,
                border: "1px solid rgba(34,211,238,0.16)",
                background: "rgba(34,211,238,0.05)",
                padding: 18,
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 10,
                }}
              >
                Disponibilidade
              </div>
              <div style={{ color: "#cffafe", fontSize: 14, lineHeight: 1.7 }}>
                {hasStatusSaveContract
                  ? "Persistência detectada pelo contrato atual."
                  : "Somente UI preparada; nenhum caminho seguro para salvar foi confirmado em api.js/contexto de autenticação."}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Vincular Discord"
        subtitle="Pegue seu ID no canal do Discord e cole abaixo para conectar sua conta."
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(88,101,242,0.30)",
            background:
              "linear-gradient(180deg, rgba(88,101,242,0.16) 0%, rgba(17,24,39,0.45) 100%)",
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 18px 36px rgba(88,101,242,0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at top right, rgba(88,101,242,0.24), transparent 36%)",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
              color: "#e0e7ff",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "rgba(88,101,242,0.18)",
                border: "1px solid rgba(88,101,242,0.28)",
                color: "#8ea0ff",
                boxShadow: "0 0 24px rgba(88,101,242,0.18)",
              }}
            >
              <DiscordIcon />
            </span>
            Discord
          </div>

          <form
            onSubmit={handleSaveDiscordId}
            style={{ position: "relative", display: "grid", gap: 14 }}
          >
            <div className="profile-discord-grid">
              <label style={{ display: "grid", gap: 8 }}>
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Seu ID do Discord
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={discordIdInput}
                  onChange={(event) => setDiscordIdInput(event.target.value)}
                  placeholder="Ex: 123456789012345678"
                  style={{
                    height: 54,
                    borderRadius: 16,
                    border: "1px solid rgba(88,101,242,0.35)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                    boxShadow: "0 0 20px rgba(88,101,242,0.08)",
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={savingDiscordId}
                style={{
                  height: 54,
                  padding: "0 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(88,101,242,0.55)",
                  background:
                    "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: savingDiscordId ? "not-allowed" : "pointer",
                  opacity: savingDiscordId ? 0.72 : 1,
                  boxShadow: "0 12px 30px rgba(88,101,242,0.20)",
                }}
              >
                {savingDiscordId ? "Salvando..." : "Salvar ID"}
              </button>
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Vá ao canal criado no Discord, clique no botão para ver seu ID e
              cole o número aqui.
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(88,101,242,0.24)",
                  background: "rgba(88,101,242,0.10)",
                  color: "#c7d2fe",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                ID vinculado: {profileSummary?.discordId || "não vinculado"}
              </div>

              {discordMessage ? (
                <div
                  style={{
                    color: discordMessage.toLowerCase().includes("sucesso")
                      ? "#86efac"
                      : "#fca5a5",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {discordMessage}
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </SectionCard>

      <MetricsOverview
        loadingSummary={loadingSummary}
        profileSummary={profileSummary}
        activeSubscriptions={activeSubscriptions}
        nextExpirationCountdown={nextExpirationCountdown}
      />

      <SectionCard title="Atividade" subtitle="Resumo real da sua atuação na org.">
        <div style={{ display: "grid", gap: 16 }}>
          <div className="profile-access-grid">
            {loadingSubscriptions ? (
              <StatCard label="Assinaturas" value="..." helpText="Carregando dados." />
            ) : subscriptions.length ? (
              subscriptions.slice(0, 4).map((subscription, index) => (
                <AccessCard key={`${getPlanName(subscription)}-${index}`} subscription={subscription} nowTs={nowTs} />
              ))
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderRadius: 26,
                  border: "1px solid rgba(99,102,241,0.16)",
                  background: "rgba(255,255,255,0.02)",
                  padding: 20,
                  color: "#9ca3af",
                  lineHeight: 1.7,
                }}
              >
                {subscriptionsError || "Nenhuma assinatura disponível para exibição."}
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}