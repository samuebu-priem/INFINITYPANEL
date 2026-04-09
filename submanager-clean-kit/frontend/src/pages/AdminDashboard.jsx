import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";

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
  return plan?.price ?? plan?.amount ?? plan?.value ?? plan?.monthlyPrice ?? 0;
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
  return (
    plan?.stock ?? plan?.quantity ?? plan?.availableQuantity ?? plan?.limit ?? null
  );
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

function StatCard({ title, value, hint, variant = "neutral" }) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat__label">
        <StatusBadge variant={variant}>{title}</StatusBadge>
      </div>
      <div className="dashboard-stat__value">{value}</div>
      <div className="dashboard-stat__hint">{hint}</div>
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
    <div className="dashboard-plan-row">
      <div>
        <div className="dashboard-plan-row__title">{title}</div>
        <StatusBadge variant={active ? "active" : "inactive"}>
          {active ? "Ativo" : "Inativo"}
        </StatusBadge>
      </div>
      <div className="dashboard-plan-row__value">{formatPrice(price)}</div>
      <div className="dashboard-plan-row__value">
        {validity ? `${validity} dias` : "—"}
      </div>
      <div className="dashboard-plan-row__value">{stock ?? "—"}</div>
    </div>
  );
}

function MiniPlanCard({ plan }) {
  const title = getPlanTitle(plan);
  const price = formatPrice(getPlanPrice(plan));
  const validity = getPlanValidity(plan);
  const active = isPlanActive(plan);

  return (
    <div className="dashboard-mini-plan">
      <div className="dashboard-mini-plan__header">
        <strong className="dashboard-mini-plan__title">{title}</strong>
        <StatusBadge variant={active ? "active" : "inactive"}>
          {active ? "Ativo" : "Inativo"}
        </StatusBadge>
      </div>
      <div className="dashboard-mini-plan__body">
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

        if (mounted) setPlans(normalized);
      } catch (error) {
        if (mounted) {
          setPlans([]);
          setPlansError(error?.message || "Não foi possível carregar os planos.");
        }
      } finally {
        if (mounted) setLoadingPlans(false);
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

    return { totalPlans, activePlans, inactivePlans, totalStock };
  }, [plans]);

  const latestPlans = useMemo(() => sortNewestPlans(plans).slice(0, 4), [plans]);

  return (
    <PageShell>
      <div className="layout-stack">
        <SectionCard
          title="Admin Dashboard"
          subtitle="Painel com os dados reais dos planos retornados pela API."
          action={
            <div className="page-actions">
              <ActionButton variant="secondary" onClick={() => window.location.reload()}>
                Atualizar painel
              </ActionButton>
              <ActionButton variant="primary" onClick={() => navigate("/plans")}>
                Ver planos
              </ActionButton>
            </div>
          }
        >
          <div className="layout-grid-4 dashboard-stats">
            <StatCard
              title="Total de planos"
              value={loadingPlans ? "..." : stats.totalPlans}
              hint="Quantidade de planos carregados do backend."
              variant="neutral"
            />
            <StatCard
              title="Planos ativos"
              value={loadingPlans ? "..." : stats.activePlans}
              hint="Itens disponíveis no momento."
              variant="success"
            />
            <StatCard
              title="Planos inativos"
              value={loadingPlans ? "..." : stats.inactivePlans}
              hint="Planos retornados com status inativo."
              variant="danger"
            />
            <StatCard
              title="Estoque somado"
              value={loadingPlans ? "..." : stats.totalStock}
              hint="Soma do estoque informado nos planos retornados."
              variant="neutral"
            />
          </div>
        </SectionCard>

        <div className="layout-grid dashboard-grid">
          <SectionCard title="Planos disponíveis" subtitle="Lista com os planos reais recebidos da API.">
            {loadingPlans ? (
              <div className="dashboard-skeleton-grid">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="dashboard-skeleton" />
                ))}
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
                description="Não há planos para exibir no momento."
                buttonLabel="Atualizar"
                onClick={() => window.location.reload()}
              />
            ) : (
              <div className="dashboard-plan-list">
                {sortNewestPlans(plans).map((plan, index) => (
                  <PlanRow key={plan?.id || `${getPlanTitle(plan)}-${index}`} plan={plan} />
                ))}
              </div>
            )}
          </SectionCard>

          <div className="dashboard-side-stack">
            <SectionCard title="Planos recentes" subtitle="Últimos itens retornados pela API.">
              {loadingPlans ? (
                <div className="dashboard-skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="dashboard-skeleton" />
                  ))}
                </div>
              ) : latestPlans.length === 0 ? (
                <EmptyState title="Sem planos recentes" description="Não há planos para mostrar." />
              ) : (
                <div className="dashboard-mini-list">
                  {latestPlans.map((plan, index) => (
                    <MiniPlanCard
                      key={plan?.id || `${getPlanTitle(plan)}-mini-${index}`}
                      plan={plan}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Ações rápidas" subtitle="Atalhos para o fluxo principal.">
              <div className="page-actions">
                <ActionButton variant="primary" onClick={() => navigate("/plans")}>
                  Ver planos
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => navigate("/admin/subscribers")}>
                  Ver assinantes
                </ActionButton>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
