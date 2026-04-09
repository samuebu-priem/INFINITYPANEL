import { Link } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";

export default function NotFound() {
  return (
    <PageShell>
      <div className="page-stack">
        <SectionCard title="Página não encontrada" subtitle="O endereço solicitado não existe.">
          <div className="page-actions">
            <ActionButton as={Link} to="/login" variant="primary">
              Ir para login
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
