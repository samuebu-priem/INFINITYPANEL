import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
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

function PlanCard({ plan, onChoose }) {
  const title = getPlanTitle(plan);
  const price = formatPrice(getPlanPrice(plan));
  const validity = getPlanValidity(plan);
  const active = isPlanActive(plan);

  return (
    <article className="plan-card">
      <div className="plan-card__top">
        <div>
          <h3 className="plan-card__title">{title}</h3>
          <p className="plan-card__price">{price}</p>
        </div>
        <StatusBadge variant={active ? "active" : "inactive"}>
          {active ? "Ativo" : "Inativo"}
        </StatusBadge>
      </div>

      <div className="plan-card__meta">
        <span>{validity ? `${validity} dias` : "Sem validade informada"}</span>
      </div>

      <ActionButton variant="primary" onClick={() => onChoose(plan)}>
        Escolher plano
      </ActionButton>
    </article>
  );
}

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        setLoading(true);
        setError("");

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
          setError(error?.message || "Não foi possível carregar os planos.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const visiblePlans = useMemo(() => plans.filter((plan) => plan), [plans]);

  return (
    <PageShell>
      <div className="page-stack">
        <SectionCard
          title="Planos"
          subtitle="Escolha um plano disponível."
          action={
            <ActionButton variant="secondary" onClick={() => navigate("/user-home")}>
              Voltar
            </ActionButton>
          }
        >
          {loading ? (
            <div className="plan-grid">
              {[1, 2, 3].map((item) => (
                <div key={item} className="plan-card plan-card--skeleton" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Falha ao carregar planos"
              description={error}
              buttonLabel="Tentar novamente"
              onClick={() => window.location.reload()}
            />
          ) : visiblePlans.length === 0 ? (
            <EmptyState
              title="Nenhum plano disponível"
              description="Não há planos para exibir no momento."
            />
          ) : (
            <div className="plan-grid">
              {visiblePlans.map((plan, index) => (
                <PlanCard
                  key={plan?.id || `${getPlanTitle(plan)}-${index}`}
                  plan={plan}
                  onChoose={setSelectedPlan}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {selectedPlan ? (
          <SectionCard
            title="Plano selecionado"
            subtitle="Confirme antes de continuar para o checkout."
            action={
              <ActionButton variant="primary" onClick={() => navigate("/checkout")}>
                Ir para checkout
              </ActionButton>
            }
          >
            <div className="selected-plan">
              <div className="selected-plan__title">{getPlanTitle(selectedPlan)}</div>
              <div className="selected-plan__subtitle">
                {formatPrice(getPlanPrice(selectedPlan))} •{" "}
                {getPlanValidity(selectedPlan)
                  ? `${getPlanValidity(selectedPlan)} dias`
                  : "Sem validade informada"}
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </PageShell>
  );
}
