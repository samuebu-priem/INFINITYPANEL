import TermsLayout from "./TermsLayout.jsx";
import { termsOfUseSections } from "../lib/terms.js";

export default function TermsOfUse() {
  return (
    <TermsLayout
      title="Termos de Uso"
      updatedAt="08 de abril de 2026"
      sections={termsOfUseSections}
    />
  );
}
