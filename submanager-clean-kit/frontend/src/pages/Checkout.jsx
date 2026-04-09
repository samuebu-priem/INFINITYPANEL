import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";
import StatusBadge from "../components/ui/StatusBadge";

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/user-home");
    }, 1200);
  }

  return (
    <PageShell>
      <div className="page-stack">
        <SectionCard
          title="Checkout"
          subtitle="Confirme os dados do plano antes de seguir."
          action={<StatusBadge variant="warning">Ação pendente</StatusBadge>}
        >
          <div className="checkout-summary">
            <div className="checkout-summary__item">
              <span className="checkout-summary__label">Plano</span>
              <span className="checkout-summary__value">Seleção atual</span>
            </div>
            <div className="checkout-summary__item">
              <span className="checkout-summary__label">Pagamento</span>
              <span className="checkout-summary__value">Aguardando confirmação</span>
            </div>
          </div>

          <div className="page-actions">
            <ActionButton variant="secondary" onClick={() => navigate("/plans")}>
              Voltar
            </ActionButton>
            <ActionButton variant="primary" onClick={handleConfirm} disabled={loading}>
              {loading ? "Processando..." : "Confirmar checkout"}
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
