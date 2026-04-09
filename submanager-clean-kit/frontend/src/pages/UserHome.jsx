import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";

const API_BASE = "/api";
const TOKEN_KEY = "submanager_token";

export default function UserHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar dados (${response.status})`);
        }

        const data = await response.json();
        const normalized = data?.data || data?.user || data || null;

        if (mounted) setProfile(normalized);
      } catch (error) {
        if (mounted) {
          setProfile(null);
          setError(error?.message || "Não foi possível carregar seus dados.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell>
      <div className="layout-stack">
        <SectionCard
          title="Minha conta"
          subtitle="Visão geral da sua assinatura e acesso."
          action={
            <ActionButton variant="secondary" onClick={() => navigate("/plans")}>
              Ver planos
            </ActionButton>
          }
        >
          {loading ? (
            <div className="user-home-loading">Carregando...</div>
          ) : error ? (
            <EmptyState
              title="Falha ao carregar dados"
              description={error}
              buttonLabel="Tentar novamente"
              onClick={() => window.location.reload()}
            />
          ) : profile ? (
            <div className="layout-grid-3 user-home-grid">
              <div className="user-home-panel">
                <div className="user-home-panel__label">Nome</div>
                <div className="user-home-panel__value">
                  {profile.name || profile.fullName || "Sem nome"}
                </div>
              </div>

              <div className="user-home-panel">
                <div className="user-home-panel__label">E-mail</div>
                <div className="user-home-panel__value">
                  {profile.email || "Sem e-mail"}
                </div>
              </div>

              <div className="user-home-panel">
                <div className="user-home-panel__label">Status</div>
                <StatusBadge variant="active">Conta ativa</StatusBadge>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Sem dados disponíveis"
              description="Não há informações para exibir no momento."
            />
          )}
        </SectionCard>

        <SectionCard title="Ações rápidas" subtitle="Fluxo principal da conta.">
          <div className="layout-grid-2 page-actions">
            <ActionButton variant="primary" onClick={() => navigate("/plans")}>
              Escolher plano
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => navigate("/checkout")}>
              Ir para checkout
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
