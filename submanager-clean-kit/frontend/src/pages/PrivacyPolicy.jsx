import TermsLayout from "./TermsLayout.jsx";
import { privacyPolicySections } from "../lib/terms.js";

export default function PrivacyPolicy() {
  return (
    <TermsLayout
      title="Política de Privacidade"
      updatedAt="08 de abril de 2026"
      sections={privacyPolicySections}
    />
  );
}
