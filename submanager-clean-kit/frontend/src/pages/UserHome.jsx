import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import { UserHomeFooter } from "../components/layout/UserHomeFooter.jsx";
import AppShell from "../layouts/AppShell";

function getPlansList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.plans)) return response.plans;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function isPlanActive(plan) {
  if (typeof plan?.active === "boolean") return plan.active;
  if (typeof plan?.isActive === "boolean") return plan.isActive;
  if (typeof plan?.enabled === "boolean") return plan.enabled;
  return true;
}

function getSubscriptionObject(response) {
  if (!response) return null;
  if (response.subscription) return response.subscription;
  if (response.data?.subscription) return response.data.subscription;
  if (response.data) return response.data;
  return response;
}

function getSubscriptionEndsAt(subscription) {
  return (
    subscription?.endsAt ||
    subscription?.expiresAt ||
    subscription?.validUntil ||
    subscription?.endDate ||
    null
  );
}

function getPlanName(subscription) {
  return (
    subscription?.plan?.name ||
    subscription?.plan?.title ||
    subscription?.planName ||
    subscription?.plan?.label ||
    "Plano ativo"
  );
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

function StatCard({ label, value, helpText }) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 22,
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
        {label}
      </div>

      <div
        style={{
          color: "#f3f4f6",
          fontSize: 34,
          lineHeight: 1.05,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      <div
        style={{
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

export default function UserHome() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get("/plans");
        setPlans(getPlansList(response).filter(isPlanActive));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const response = await api.get("/subscriptions/me");
        setSubscription(getSubscriptionObject(response));
      } catch (error) {
        setSubscription(null);
        setSubscriptionError(error?.response?.data?.message || "");
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadPlans();
    loadSubscription();
  }, []);

  const remainingDays = useMemo(() => {
    const endsAt = getSubscriptionEndsAt(subscription);
    if (!endsAt) return null;

    const endDate = new Date(endsAt);
    if (Number.isNaN(endDate.getTime())) return null;

    const diff = Math.ceil(
      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(diff, 0);
  }, [subscription]);

  const visiblePlans = useMemo(() => plans.filter(isPlanActive), [plans]);

  const content = (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .user-home-top-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1.15fr 0.85fr;
        }

        .user-home-stats-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .user-home-plans-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .user-home-top-grid,
          .user-home-plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .user-home-top-grid,
          .user-home-stats-grid,
          .user-home-plans-grid {
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
              Área do usuário
            </div>

            <h1
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 38,
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              Bem-vindo, {user?.username || user?.name || "usuário"}
            </h1>

            <p
              style={{
                margin: "14px 0 0",
                color: "#9ca3af",
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 680,
              }}
            >
              Veja sua assinatura atual, acompanhe o prazo restante e confira
              os planos disponíveis no momento.
            </p>
          </div>

          {subscription ? (
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
                  Status
                </div>
                <div
                  style={{
                    color: "#86efac",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  Ativa
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
                  Plano
                </div>
                <div
                  style={{
                    color: "#f3f4f6",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {getPlanName(subscription)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {(subscription || subscriptionError || loadingSubscription) && (
        <div className="user-home-top-grid">
          <SectionCard
            title="Assinatura atual"
            subtitle="Resumo do acesso retornado pela API."
          >
            <div className="user-home-stats-grid">
              <StatCard
                label="Dias restantes"
                value={loadingSubscription ? "..." : remainingDays ?? "—"}
                helpText={
                  loadingSubscription
                    ? "Carregando assinatura..."
                    : remainingDays === null
                    ? "Sem data final disponível."
                    : remainingDays === 1
                    ? "1 dia restante"
                    : `${remainingDays} dias restantes`
                }
              />

              <StatCard
                label="Plano"
                value={
                  subscription
                    ? getPlanName(subscription)
                    : loadingSubscription
                    ? "..."
                    : "—"
                }
                helpText={
                  subscription
                    ? "Seu acesso está ativo no momento."
                    : "Nenhuma assinatura retornada."
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Seu acesso"
            subtitle="Situação atual da assinatura."
          >
            <div
              style={{
                borderRadius: 22,
                border: "1px solid #1f2937",
                background: "rgba(255,255,255,0.03)",
                padding: 18,
              }}
            >
              <div
                style={{
                  color: "#f3f4f6",
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {subscription
                  ? getPlanName(subscription)
                  : "Nenhuma assinatura ativa"}
              </div>

              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {subscription
                  ? "Seu acesso foi identificado com base na assinatura retornada pela API."
                  : subscriptionError
                  ? subscriptionError
                  : "Nenhuma assinatura foi retornada pela API no momento."}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard
        title="Planos disponíveis"
        subtitle="Catálogo retornado por /api/plans."
      >
        {loadingPlans ? (
          <div
            style={{
              borderRadius: 22,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.03)",
              padding: 20,
              color: "#9ca3af",
            }}
          >
            Carregando planos...
          </div>
        ) : visiblePlans.length === 0 ? (
          <EmptyState
            title="Nenhum plano disponível"
            description="Não há planos ativos para exibir no momento."
          />
        ) : (
          <div className="user-home-plans-grid">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} user={user} showCheckout />
            ))}
          </div>
        )}
      </SectionCard>

      <UserHomeFooter
        discordUrl={import.meta.env.VITE_DISCORD_URL || "#"}
        instagramUrl={import.meta.env.VITE_INSTAGRAM_URL || "#"}
      />
    </div>
  );

  return user?.role ? <AppShell>{content}</AppShell> : content;
}