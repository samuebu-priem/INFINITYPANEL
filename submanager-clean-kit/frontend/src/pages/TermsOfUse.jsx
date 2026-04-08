import TermsLayout from "./TermsLayout.jsx";
import { termsOfUseSections, termsUpdatedAt } from "../lib/terms.js";

export default function TermsOfUse() {
  return <TermsLayout title="Termos de Uso" updatedAt={termsUpdatedAt} sections={termsOfUseSections} />;
}