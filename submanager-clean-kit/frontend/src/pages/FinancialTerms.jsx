import TermsLayout from "./TermsLayout.jsx";
import { financialTermsSections, termsUpdatedAt } from "../lib/terms.js";

export default function FinancialTerms() {
  return <TermsLayout title="Termos Financeiros" updatedAt={termsUpdatedAt} sections={financialTermsSections} />;
}