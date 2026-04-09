import TermsLayout from "./TermsLayout.jsx";

const privacyPolicySections = [
  {
    title: "Dados coletados",
    body: "A plataforma usa os dados necessários para autenticação, exibição da conta e gerenciamento dos planos e assinaturas disponíveis no ambiente.",
  },
  {
    title: "Uso das informações",
    body: "As informações são usadas para autenticar acesso, carregar planos, consultar assinatura do usuário e manter as funcionalidades da conta.",
  },
  {
    title: "Compartilhamento",
    body: "Dados só devem ser compartilhados quando for necessário para operação do serviço, cumprimento legal ou processamento de pagamentos.",
  },
];

export default function PrivacyPolicy() {
  return (
    <TermsLayout
      title="Política de Privacidade"
      updatedAt="16/04/2026"
      sections={privacyPolicySections}
    />
  );
}