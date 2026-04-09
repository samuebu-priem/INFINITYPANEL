
import { formatCurrency, formatDate } from "@/utils";

export default function SubscriptionStatus({ subscription }) {
  if (!subscription) {
    return (
      <div
        style={{
          borderRadius: 28,
          border: "1px solid #1f2937",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          padding: 24,
          boxShadow: "0 14px 32px rgba(0,0,0,0.20)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: "#f3f4f6",
          }}
        >
          Nenhuma assinatura ativa
        </h3>

        <p
          style={{
            margin: "10px 0 0",
            color: "#9ca3af",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          Escolha um plano abaixo para ativar sua conta.
        </p>
      </div>
    );
  }

  const startDate =
    subscription.start_date ??
    subscription.startsAt ??
    subscription.startDate ??
    subscription.createdAt;

  const endDate =
    subscription.end_date ?? subscription.endsAt ?? subscription.endDate;

  const status = subscription.status ?? subscription.payment_status ?? "active";

  const amount = Number(
    subscription.amount_paid ??
      subscription.amountPaid ??
      subscription.plan_amount ??
      0
  );

  return (
    <div
      style={{
        borderRadius: 28,
        border: "1px solid rgba(34,197,94,0.18)",
        background:
          "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
        padding: 24,
        boxShadow: "0 14px 32px rgba(0,0,0,0.20)",
      }}
    >
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
          <p
            style={{
              margin: 0,
              color: "#86efac",
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            Assinatura ativa
          </p>

          <h3
            style={{
              margin: "8px 0 0",
              fontSize: 28,
              fontWeight: 900,
              color: "#f3f4f6",
              lineHeight: 1.1,
            }}
          >
            {subscription.plan_name ?? subscription.plan?.name ?? "Plano"}
          </h3>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            Valor pago
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: "#f3f4f6",
            }}
          >
            {formatCurrency(amount)}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
        className="subscription-status-grid"
      >
        <Info label="Início" value={formatDate(startDate)} />
        <Info label="Vencimento" value={formatDate(endDate)} />
        <Info label="Status" value={status} />
      </div>

      <style>{`
        @media (max-width: 860px) {
          .subscription-status-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid #1f2937",
        background: "rgba(255,255,255,0.03)",
        padding: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: 13,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontWeight: 700,
          color: "#f3f4f6",
          fontSize: 15,
        }}
      >
        {value}
      </p>
    </div>
  );
}