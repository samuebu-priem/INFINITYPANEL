import TermsLayout from "./TermsLayout.jsx";

const termsOfUseSections = [
  {
    title: "Uso da conta",
    body: "O acesso à plataforma é pessoal e depende das credenciais cadastradas pelo usuário. A conta não deve ser compartilhada.",
  },
  {
    title: "Disponibilidade dos recursos",
    body: "As telas e ações exibidas pela interface dependem dos contratos reais expostos pelo backend. Se um dado não estiver disponível, a interface o oculta.",
  },
  {
    title: "Responsabilidade",
    body: "O usuário é responsável pelas informações enviadas no cadastro, pelos dados de acesso e pelo uso adequado dos recursos da plataforma.",
  },
];

export default function TermsOfUse() {
  return (
    <TermsLayout
      title="Termos de Uso"
      updatedAt="16/04/2026"
      sections={termsOfUseSections}
    />
  );
}