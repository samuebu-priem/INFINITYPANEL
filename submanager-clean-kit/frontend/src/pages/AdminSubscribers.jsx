import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";

const API_BASE = "/api";
const TOKEN_KEY = "submanager_token";

function getSubscriberName(subscriber) {
  return (
    subscriber?.name ||
    subscriber?.fullName ||
    subscriber?.user?.name ||
    subscriber?.user?.fullName ||
    "Assinante sem nome"
  );
}

function getSubscriberEmail(subscriber) {
  return subscriber?.email || subscriber?.user?.email || "Sem e-mail";
}

function getSubscriberStatus(subscriber) {
  const status = String(
    subscriber?.status ||
      subscriber?.subscriptionStatus ||
      subscriber?.planStatus ||
      "active",
  ).toLowerCase();

  if (["active", "ativo", "paid", "pago", "enabled"].includes(status)) {
    return "active";
  }

  if (["inactive", "inativo", "canceled", "cancelado", "expired"].includes(status)) {
    return "inactive";
  }

  if (["pending", "aguardando", "pending_payment"].includes(status)) {
    return "warning";
  }

  return "neutral";
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSubscribers() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/subscribers`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao buscar assinantes (${response.status})`);
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.subscribers)
          ? data.subscribers
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mounted) setSubscribers(normalized);
      } catch (error) {
        if (mounted) {
          setSubscribers([]);
          setError(error?.message || "Não foi possível carregar os assinantes.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSubscribers();

    return () => {
      mounted = false;
    };
  }, []);

  const totalSubscribers = useMemo(() => subscribers.length, [subscribers]);

  return (
    <PageShell>
      <div className="page-stack">
        <SectionCard
          title="Assinantes"
          subtitle="Lista dos assinantes retornados pela API."
          action={<StatusBadge variant="neutral">{totalSubscribers} total</StatusBadge>}
        >
          {loading ? (
            <div className="table-skeleton">Carregando...</div>
          ) : error ? (
            <EmptyState
              title="Falha ao carregar assinantes"
              description={error}
              buttonLabel="Tentar novamente"
              onClick={() => window.location.reload()}
            />
          ) : subscribers.length === 0 ? (
            <EmptyState
              title="Nenhum assinante encontrado"
              description="Não há assinantes para exibir no momento."
            />
          ) : (
            <div className="subscriber-list">
              {subscribers.map((subscriber, index) => (
                <article className="subscriber-row" key={subscriber?.id || `${getSubscriberEmail(subscriber)}-${index}`}>
                  <div className="subscriber-row__main">
                    <div className="subscriber-row__name">{getSubscriberName(subscriber)}</div>
                    <div className="subscriber-row__email">{getSubscriberEmail(subscriber)}</div>
                  </div>
                  <StatusBadge variant={getSubscriberStatus(subscriber)}>
                    {String(subscriber?.status || "ativo")}
                  </StatusBadge>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ações rápidas" subtitle="Operações administrativas disponíveis.">
          <div className="page-actions">
            <ActionButton variant="secondary" onClick={() => window.location.reload()}>
              Atualizar
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
