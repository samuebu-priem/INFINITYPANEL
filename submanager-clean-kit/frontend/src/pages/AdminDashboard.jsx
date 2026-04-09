import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";
const TOKEN_KEY = "submanager_token";

function formatPrice(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getPlanTitle(plan) {
  return (
    plan?.title ||
    plan?.name ||
    plan?.planName ||
    plan?.label ||
    "Plano sem nome"
  );
}

function getPlanPrice(plan) {
  return (
    plan?.price ??
    plan?.amount ??
    plan?.value ??
    plan?.monthlyPrice ??
    0
  );
}

function getPlanValidity(plan) {
  return (
    plan?.durationDays ??
    plan?.validityDays ??
    plan?.days ??
    plan?.duration ??
    null
  );
}

function getPlanStock(plan) {
  const stock =
    plan?.stock ??
    plan?.quantity ??
    plan?.availableQuantity ??
    plan?.limit ??
    null;

  return stock;
}

function isPlanActive(plan) {
  if (typeof plan?.active === "boolean") return plan.active;
  if (typeof plan?.isActive === "boolean") return plan.isActive;
  if (typeof plan?.enabled === "boolean") return plan.enabled;
  if (typeof plan?.available === "boolean") return plan.available;
  if (typeof plan?.status === "string") {
    const status = plan.status.toLowerCase();
    return ["active", "ativo", "enabled", "available"].includes(status);
  }
  return true;
}

function getCreatedAt(plan) {
  return (
    plan?.createdAt ||
    plan?.created_at ||
    plan?.updatedAt ||
    plan?.updated_at ||
    null
  );
}

function sortNewestPlans(plans) {
  return [...plans].sort((a, b) => {
    const aDate = getCreatedAt(a) ? new Date(getCreatedAt(a)).getTime() : 0;
    const bDate = getCreatedAt(b) ? new Date(getCreatedAt(b)).getTime() : 0;
    return bDate - aDate;
  });
}

function DashboardStatCard({ title, value, hint, accent = "primary" }) {
  const accentStyles = {
    primary: {
      glow: "0 0 30px rgba(99, 102, 241, 0.22)",
      border: "rgba(99, 102, 241, 0.35)",
      chip: "rgba(99, 102, 241, 0.14)",
      dot: "#6366f1",
    },
    success: {
      glow: "0 0 30px rgba(34, 197, 94, 0.18)",
      border: "rgba(34, 197, 94, 0.28)",
      chip: "rgba(34, 197, 94, 0.12)",
      dot: "#22c55e",
    },
    danger: {
      glow: "0 0 30px rgba(239, 68, 68, 0.18)",
      border: "rgba(239, 68, 68, 0.28)",
      chip: "rgba(239, 68, 68, 0.12)",
      dot: "#ef4444",
    },
    neutral: {
      glow: "0 0 30px rgba(148, 163, 184, 0.10)",
      border: "rgba(148, 163, 184, 0.18)",
      chip: "rgba(148, 163, 184, 0.10)",
      dot: "#94a3b8",
    },
  };

  const theme = accentStyles[accent] || accentStyles.primary;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.96) 0%, rgba(12,17,24,0.98) 100%)",
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 20,
        boxShadow: theme.glow,
        position: "relative",
        overflow: "hidden",
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
          fontWeight: 600,
          letterSpacing: 0.4,
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
          fontSize: 32,
          fontWeight: 800,
          color: "#f3f4f6",
          lineHeight: 1.05,
          marginBottom: 8,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9ca3af",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        border: "1px solid rgba(31, 41, 55, 1)",
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
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
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      {children}
    </section>
  );
}

function ActionButton({ children, onClick, variant = "secondary" }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      color: "#ffffff",
      border: "1px solid rgba(99, 102, 241, 0.65)",
      boxShadow: "0 0 30px rgba(99,102,241,0.28)",
    },
    secondary: {
      background: "rgba(99, 102, 241, 0.08)",
      color: "#e5e7eb",
      border: "1px solid rgba(99, 102, 241, 0.18)",
      boxShadow: "none",
    },
  };

  const current = styles[variant] || styles.secondary;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...current,
        borderRadius: 16,
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.opacity = "0.96";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.opacity = "1";
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, description, buttonLabel, onClick }) {
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
          fontWeight: 800,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "10px auto 18px",
          maxWidth: 480,
          color: "#9ca3af",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {buttonLabel ? (
        <ActionButton onClick={onClick} variant="primary">
          {buttonLabel}
        </ActionButton>
      ) : null}
    </div>
  );
}

function PlanRow({ plan }) {
  const title = getPlanTitle(plan);
  const price = getPlanPrice(plan);
  const validity = getPlanValidity(plan);
  const stock = getPlanStock(plan);
  const active = isPlanActive(plan);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) 0.9fr 0.8fr 0.8fr auto",
        gap: 14,
        alignItems: "center",
        padding: "16px 18px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(31, 41, 55, 1)",
        borderRadius: 20,
      }}
      className="admin-dashboard-plan-row"
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#f3f4f6",
            fontWeight: 700,
            fontSize: 15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={title}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
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
                ? "0 0 12px rgba(34,197,94,0.8)"
                : "0 0 12px rgba(239,68,68,0.8)",
            }}
          />
          {active ? "Ativo" : "Inativo"}
        </div>
      </div>

      <div style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 14 }}>
        {formatPrice(price)}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: 14 }}>
        {validity ? `${validity} dias` : "—"}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: 14 }}>
        {stock !== null && stock !== undefined ? stock : "—"}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: 12,
          fontWeight: 700,
          textAlign: "right",
        }}
      >
        Plano
      </div>
    </div>
  );
}

function MiniPlanCard({ plan }) {
  const title = getPlanTitle(plan);
  const price = formatPrice(getPlanPrice(plan));
  const validity = getPlanValidity(plan);
  const active = isPlanActive(plan);

  return (
    <div
      style={{
        border: "1px solid rgba(31, 41, 55, 1)",
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <strong
          style={{
            color: "#f3f4f6",
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            color: active ? "#86efac" : "#fca5a5",
            background: active
              ? "rgba(34,197,94,0.10)"
              : "rgba(239,68,68,0.10)",
            border: active
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(239,68,68,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {active ? "ATIVO" : "INATIVO"}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          color: "#cbd5e1",
          fontSize: 13,
          display: "grid",
          gap: 6,
        }}
      >
        <span>Preço: {price}</span>
        <span>Validade: {validity ? `${validity} dias` : "—"}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        setLoadingPlans(true);
        setPlansError("");

        const token = localStorage.getItem(TOKEN_KEY);

        const response = await fetch(`${API_BASE}/plans`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao buscar planos (${response.status})`);
        }

        const data = await response.json();

        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.plans)
          ? data.plans
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mounted) {
          setPlans(normalized);
        }
      } catch (error) {
        if (mounted) {
          setPlans([]);
          setPlansError(
            error?.message || "Não foi possível carregar os planos."
          );
        }
      } finally {
        if (mounted) {
          setLoadingPlans(false);
        }
      }
    }

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((plan) => isPlanActive(plan)).length;
    const inactivePlans = totalPlans - activePlans;

    const totalStock = plans.reduce((acc, plan) => {
      const stock = Number(getPlanStock(plan));
      return acc + (Number.isFinite(stock) ? stock : 0);
    }, 0);

    return {
      totalPlans,
      activePlans,
      inactivePlans,
      totalStock,
    };
  }, [plans]);

  const latestPlans = useMemo(() => {
    return sortNewestPlans(plans).slice(0, 4);
  }, [plans]);

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.10) 0%, rgba(11,15,20,0) 32%), #0b0f14",
        padding: 24,
      }}
    >
      <style>
        {`
          .admin-dashboard-grid {
            display: grid;
            grid-template-columns: 1.5fr 0.95fr;
            gap: 20px;
          }

          .admin-dashboard-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          .admin-dashboard-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          @media (max-width: 1180px) {
            .admin-dashboard-stats {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .admin-dashboard-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 860px) {
            .admin-dashboard-quick-actions {
              grid-template-columns: 1fr;
            }

            .admin-dashboard-plan-row {
              grid-template-columns: 1fr;
              text-align: left;
            }
          }

          @media (max-width: 640px) {
            .admin-dashboard-stats {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: 30,
            padding: 28,
            boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 85% 15%, rgba(99,102,241,0.22), transparent 24%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
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
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6366f1",
                    boxShadow: "0 0 16px rgba(99,102,241,0.95)",
                  }}
                />
                visao geral
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
                Admin Dashboard
              </h1>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#9ca3af",
                  fontSize: 15,
                  maxWidth: 700,
                  lineHeight: 1.65,
                }}
              >
                Gerencie a plataforma"
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <ActionButton
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Atualizar painel
              </ActionButton>

              <ActionButton
                variant="primary"
                onClick={() => navigate("/plans")}
              >
                Criar plano
              </ActionButton>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-stats">
          <DashboardStatCard
            title="Total de planos"
            value={loadingPlans ? "..." : stats.totalPlans}
            hint="Quantidade total de planos carregados do backend."
            accent="primary"
          />

          <DashboardStatCard
            title="Planos ativos"
            value={loadingPlans ? "..." : stats.activePlans}
            hint="Planos disponíveis para operação no momento."
            accent="success"
          />

          <DashboardStatCard
            title="Planos inativos"
            value={loadingPlans ? "..." : stats.inactivePlans}
            hint="Planos pausados ou indisponíveis."
            accent="danger"
          />

          <DashboardStatCard
            title="Estoque somado"
            value={loadingPlans ? "..." : stats.totalStock}
            hint="Soma de estoque encontrada nos planos retornados."
            accent="neutral"
          />
        </div>

        <div className="admin-dashboard-grid">
          <SectionCard
            title="Planos disponíveis"
            subtitle="Visual premium dos planos cadastrados atualmente."
            action={
              <ActionButton
                variant="secondary"
                onClick={() => navigate("/plans")}
              >
                Gerenciar planos
              </ActionButton>
            }
          >
            {loadingPlans ? (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    style={{
                      height: 86,
                      borderRadius: 20,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
                      backgroundSize: "400% 100%",
                      animation: "pulse 1.8s ease infinite",
                      border: "1px solid rgba(31,41,55,1)",
                    }}
                  />
                ))}
                <style>
                  {`
                    @keyframes pulse {
                      0% { background-position: 100% 50%; }
                      100% { background-position: 0 50%; }
                    }
                  `}
                </style>
              </div>
            ) : plansError ? (
              <EmptyState
                title="Falha ao carregar planos"
                description={plansError}
                buttonLabel="Tentar novamente"
                onClick={() => window.location.reload()}
              />
            ) : plans.length === 0 ? (
              <EmptyState
                title="Nenhum plano cadastrado"
                description="Seu painel já está pronto, mas ainda não existem planos para exibir. Crie o primeiro plano para começar."
                buttonLabel="Criar primeiro plano"
                onClick={() => navigate("/plans")}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {sortNewestPlans(plans).map((plan, index) => (
                  <PlanRow
                    key={plan?.id || `${getPlanTitle(plan)}-${index}`}
                    plan={plan}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <div
            style={{
              display: "grid",
              gap: 20,
              alignContent: "start",
            }}
          >
            <SectionCard
              title="Planos recentes"
              subtitle="Os últimos planos carregados no painel."
            >
              {loadingPlans ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      style={{
                        height: 92,
                        borderRadius: 20,
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 37%, rgba(255,255,255,0.03) 63%)",
                        backgroundSize: "400% 100%",
                        animation: "pulse 1.8s ease infinite",
                        border: "1px solid rgba(31,41,55,1)",
                      }}
                    />
                  ))}
                </div>
              ) : latestPlans.length === 0 ? (
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Sem planos recentes para mostrar.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {latestPlans.map((plan, index) => (
                    <MiniPlanCard
                      key={plan?.id || `${getPlanTitle(plan)}-mini-${index}`}
                      plan={plan}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Ações rápidas"
              subtitle="Atalhos diretos para o fluxo principal."
            >
              <div className="admin-dashboard-quick-actions">
                <ActionButton
                  variant="primary"
                  onClick={() => navigate("/plans")}
                >
                  Criar plano
                </ActionButton>

                <ActionButton
                  variant="secondary"
                  onClick={() => navigate("/plans")}
                >
                  Gerenciar planos
                </ActionButton>

                <ActionButton
                  variant="secondary"
                  onClick={() => navigate("/admin/subscribers")}
                >
                  Ver assinantes
                </ActionButton>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}