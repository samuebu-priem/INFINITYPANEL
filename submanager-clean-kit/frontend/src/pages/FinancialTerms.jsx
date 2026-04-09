import TermsLayout from "./TermsLayout.jsx";

const financialTermsSections = [
  {
    title: "Pagamentos",
    body: "Os valores exibidos na plataforma seguem o que for retornado pela API de planos. Quando existir cobrança, o valor final informado no momento da compra prevalece sobre qualquer referência anterior.",
  },
  {
    title: "Conciliação",
    body: "A liberação de acesso depende da confirmação do pagamento pelo backend. Não há ativação manual sem confirmação da transação.",
  },
  {
    title: "Reembolsos e ajustes",
    body: "Pedidos de reembolso, cancelamentos e ajustes financeiros seguem as regras definidas pelo contrato de pagamento e pelos canais oficiais da operação.",
  },
];

export default function FinancialTerms() {
  return (
    <TermsLayout
      title="Termos Financeiros"
      updatedAt="16/04/2026"
      sections={financialTermsSections}
    />
  );
}