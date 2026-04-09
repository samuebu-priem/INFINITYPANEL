import ActionButton from "../ui/ActionButton";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";

export default function CheckoutModal({ open, plan, onClose, onConfirm }) {
  if (!open) return null;

  const title = plan?.title || plan?.name || "Plano selecionado";
  const price = plan?.price || plan?.amount || plan?.value || 0;
  const validity =
    plan?.durationDays || plan?.validityDays || plan?.days || plan?.duration || null;

  return (
    <div className="checkout-modal">
      <div className="checkout-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="checkout-modal__dialog" role="dialog" aria-modal="true">
        <SectionCard
          title="Checkout"
          subtitle="Revise os dados antes de confirmar."
          action={<StatusBadge variant="neutral">Etapa final</StatusBadge>}
        >
          <div className="checkout-modal__content">
            <div className="checkout-modal__plan">
              <div className="checkout-modal__plan-title">{title}</div>
              <div className="checkout-modal__plan-meta">
                {price} {validity ? `• ${validity} dias` : ""}
              </div>
            </div>

            <div className="checkout-modal__actions">
              <ActionButton variant="secondary" onClick={onClose}>
                Cancelar
              </ActionButton>
              <ActionButton variant="primary" onClick={onConfirm}>
                Confirmar pagamento
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
