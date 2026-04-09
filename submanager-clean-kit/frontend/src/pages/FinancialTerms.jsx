import TermsLayout from "./TermsLayout.jsx";
import { financialTermsSections } from "../lib/terms.js";

export default function FinancialTerms() {
  return (
    <TermsLayout
      title="Termos Financeiros"
      updatedAt="08 de abril de 2026"
      sections={financialTermsSections}
    />
  );
}
