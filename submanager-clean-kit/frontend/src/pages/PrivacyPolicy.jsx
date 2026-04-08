import TermsLayout from "./TermsLayout.jsx";
import { privacyPolicySections, termsUpdatedAt } from "../lib/terms.js";

export default function PrivacyPolicy() {
  return <TermsLayout title="Política de Privacidade" updatedAt={termsUpdatedAt} sections={privacyPolicySections} />;
}