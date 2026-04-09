import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/auth.jsx";
import { PlanCard } from "../components/subscriptions/PlanCard.jsx";
import {
  activatePlan,
  deactivatePlan,
  deletePlan,
} from "../lib/adminAction.js";
import AppShell from "../layouts/AppShell";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function parseMetadata(input) {
  if (!input) return undefined;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

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
  if (typeof plan?.available === "boolean") return plan.available;
  return true;
}

function getPlanName(plan) {
  return plan?.name || plan?.title || plan?.label || "Plano sem nome";
}

function getPlanAmount(plan) {
  return plan?.amount ?? plan?.price ?? plan?.value ?? plan?.monthlyPrice ?? 0;
}

function getPlanDuration(plan) {
  return (
    plan?.metadata?.validityDays ??
    plan?.metadata?.days ??
    plan?.days ??
    plan?.durationDays ??
    plan?.duration ??
    null
  );
}

function getPlanStock(plan) {
  return plan?.quantity ?? plan?.metadata?.stock ?? null;
}

function ActionButton({ children, onClick, variant = "secondary", type = "button", disabled = false }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      color: "#ffffff",
      border: "1px solid rgba(99, 102, 241, 0.65)",
      boxShadow: "0 0 30px rgba(99,102,241,0.22)",
    },
    secondary: {
      background: "rgba(99, 102, 241, 0.08)",
      color: "#e5e7eb",
      border: "1px solid rgba(99, 102, 241, 0.18)",
      boxShadow: "none",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.12)",
      color: "#fecaca",
      border: "1px solid rgba(239, 68, 68, 0.28)",
      boxShadow: "none",
    },
    success: {
      background: "rgba(34, 197, 94, 0.12)",
      color: "#bbf7d0",
      border: "1px solid rgba(34, 197, 94, 0.28)",
      boxShadow: "none",
    },
  };

  const current = styles[variant] || styles.secondary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...current,
        height: 46,
        padding: "0 16px",
        borderRadius: 16,
        fontSize: 14,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, action, children }) {
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

function AdminPlanCard({ plan, onEdit, onToggleStatus, onDelete }) {
  const active = isPlanActive(plan);

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
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                color: "#f3f4f6",
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {getPlanName(plan)}
            </h3>

            <p
              style={{
                margin: "8px 0 0",
                color: "#9ca3af",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {plan.description || "Sem descrição"}
            </p>
          </div>

          <span
            style={{
              flex: "0 0 auto",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              color: active ? "#86efac" : "#fca5a5",
              background: active
                ? "rgba(34,197,94,0.10)"
                : "rgba(239,68,68,0.10)",
              border: active
                ? "1px solid rgba(34,197,94,0.18)"
                : "1px solid rgba(239,68,68,0.18)",
            }}
          >
            {active ? "ATIVO" : "INATIVO"}
          </span>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {plan.metadata?.originalAmount ? (
            <span
              style={{
                color: "#6b7280",
                textDecoration: "line-through",
                fontSize: 14,
              }}
            >
              {formatCurrency(plan.metadata.originalAmount)}
            </span>
          ) : null}

          <span
            style={{
              color: "#f3f4f6",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {formatCurrency(getPlanAmount(plan))}
          </span>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 8,
            color: "#cbd5e1",
            fontSize: 14,
          }}
        >
          <span>Validade: {getPlanDuration(plan) ?? 0} dias</span>
          <span>Estoque: {getPlanStock(plan) ?? 0}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <ActionButton variant="secondary" onClick={() => onEdit(plan)}>
          Editar
        </ActionButton>

        <ActionButton
          variant={active ? "danger" : "success"}
          onClick={() => onToggleStatus(plan.id, active)}
        >
          {active ? "Desativar" : "Ativar"}
        </ActionButton>

        <ActionButton variant="secondary" onClick={() => onDelete(plan.id)}>
          Excluir
        </ActionButton>
      </div>
    </div>
  );
}

export default function Plans() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("plans");
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    amount: "",
    billingCycle: "MONTHLY",
    currency: "BRL",
    quantity: "",
    durationDays: "",
    originalAmount: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlans = async () => {
    try {
      const response = await api.get("/plans");
      const list = getPlansList(response).map((plan) => ({
        ...plan,
        metadata:
          typeof plan.metadata === "string"
            ? parseMetadata(plan.metadata)
            : plan.metadata,
      }));
      setPlans(list);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const visiblePlans = useMemo(() => plans.filter(Boolean), [plans]);

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      description: "",
      amount: "",
      billingCycle: "MONTHLY",
      currency: "BRL",
      quantity: "",
      durationDays: "",
      originalAmount: "",
    });
  };

  const startCreate = () => {
    resetForm();
    setTab("editor");
  };

  const startEdit = (plan) => {
    const normalizedMetadata =
      typeof plan.metadata === "object" && plan.metadata ? plan.metadata : {};

    setForm({
      id: plan.id,
      name: plan.name || "",
      description: plan.description || "",
      amount: String(plan.amount ?? ""),
      billingCycle: plan.billingCycle || "MONTHLY",
      currency: plan.currency || "BRL",
      quantity: String(plan.quantity ?? normalizedMetadata.stock ?? ""),
      durationDays: String(
        normalizedMetadata.validityDays ??
          normalizedMetadata.days ??
          normalizedMetadata.durationDays ??
          ""
      ),
      originalAmount: String(
        plan.originalAmount ??
          plan.oldAmount ??
          normalizedMetadata.originalAmount ??
          normalizedMetadata.oldAmount ??
          normalizedMetadata.promotionalPrice ??
          ""
      ),
    });

    setTab("editor");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      name: form.name,
      description: form.description || null,
      amount: Number(form.amount || 0),
      billingCycle: form.billingCycle,
      currency: form.currency,
      quantity: Number(form.quantity || 0),
      metadata: {
        ...(Number(form.durationDays) > 0
          ? { validityDays: Number(form.durationDays) }
          : {}),
        ...(Number(form.originalAmount) > 0
          ? { originalAmount: Number(form.originalAmount) }
          : {}),
      },
    };

    try {
      if (form.id) {
        await api.patch(`/plans/${form.id}`, payload);
        setMessage("Plano atualizado com sucesso.");
      } else {
        await api.post("/plans", payload);
        setMessage("Plano criado com sucesso.");
      }

      resetForm();
      await loadPlans();
      setTab("plans");
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Não foi possível salvar o plano."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    setMessage("");

    try {
      await deletePlan(planId);
      setMessage("Plano excluído com sucesso.");
      await loadPlans();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Não foi possível excluir o plano."
      );
    }
  };

  const handleToggleStatus = async (planId, active) => {
    setMessage("");

    try {
      if (active) {
        await deactivatePlan(planId);
        setMessage("Plano desativado com sucesso.");
      } else {
        await activatePlan(planId);
        setMessage("Plano ativado com sucesso.");
      }

      await loadPlans();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Não foi possível alterar o status do plano."
      );
    }
  };

  const content = (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`
        .plans-admin-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .plans-user-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .plans-editor-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 1180px) {
          .plans-admin-grid,
          .plans-user-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .plans-editor-grid,
          .plans-admin-grid,
          .plans-user-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <SectionCard
        title="Catálogo de planos"
        subtitle={
          isAdmin
            ? "Criação, edição e status usando a API real."
            : "Planos disponíveis retornados pela API."
        }
        action={
          isAdmin ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ActionButton
                variant={tab === "plans" ? "primary" : "secondary"}
                onClick={() => setTab("plans")}
              >
                Lista
              </ActionButton>
              <ActionButton
                variant={tab === "editor" ? "primary" : "secondary"}
                onClick={startCreate}
              >
                Criar plano
              </ActionButton>
            </div>
          ) : null
        }
      >
        {message ? (
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              borderRadius: 18,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.03)",
              color: "#e5e7eb",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        ) : null}

        {isAdmin && tab === "editor" ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {form.id ? "Editar plano" : "Criar plano"}
                </div>
                <h3
                  style={{
                    margin: "8px 0 0",
                    color: "#f3f4f6",
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  Gerenciar plano
                </h3>
              </div>

              <ActionButton variant="secondary" onClick={resetForm}>
                Limpar
              </ActionButton>
            </div>

            <div className="plans-editor-grid">
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Título
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome do plano"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Preço
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Preço original
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form.originalAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      originalAmount: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Validade em dias
                </span>
                <input
                  type="number"
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationDays: event.target.value,
                    }))
                  }
                  placeholder="30"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Estoque
                </span>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  placeholder="30"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Ciclo
                </span>
                <select
                  value={form.billingCycle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingCycle: event.target.value,
                    }))
                  }
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "#121821",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensal</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Moeda
                </span>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                  placeholder="BRL"
                  style={{
                    height: 52,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>
                  Descrição
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descrição do plano"
                  style={{
                    minHeight: 120,
                    borderRadius: 16,
                    border: "1px solid #1f2937",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f3f4f6",
                    padding: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ActionButton type="submit" variant="primary" disabled={saving}>
                {saving ? "Salvando..." : form.id ? "Atualizar plano" : "Criar plano"}
              </ActionButton>
            </div>
          </form>
        ) : loading ? (
          <SectionCard title="Carregando" subtitle="Buscando planos da API.">
            <div style={{ color: "#e5e7eb" }}>Carregando planos...</div>
          </SectionCard>
        ) : visiblePlans.length === 0 ? (
          <EmptyState
            title="Nenhum plano disponível"
            description="Não há planos para exibir no momento."
          />
        ) : isAdmin ? (
          <div className="plans-admin-grid">
            {visiblePlans.map((plan) => (
              <AdminPlanCard
                key={plan.id}
                plan={plan}
                onEdit={startEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="plans-user-grid">
            {visiblePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} user={user} showCheckout />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );

  return user?.role ? <AppShell>{content}</AppShell> : content;
}