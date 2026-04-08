import { Instagram, MessageCircleMore, Shield, FileText } from "lucide-react";
import { useState } from "react";
import { financialTermsSections, privacyPolicySections } from "../../lib/terms.js";
import { TermsModal } from "../ui/TermsModal.jsx";

function TermsContent({ terms }) {
  return (
    <div className="space-y-4">
      {terms.map((term) => (
        <section key={term.title}>
          <h3 className="text-lg font-semibold text-white">{term.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{term.body}</p>
        </section>
      ))}
    </div>
  );
}

function SocialIconLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition duration-200 hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300"
    >
      <span className="transition duration-200 group-hover:scale-110">{children}</span>
    </a>
  );
}

export function UserHomeFooter({ discordUrl, instagramUrl }) {
  const [activeTerms, setActiveTerms] = useState(null);

  return (
    <>
      <footer className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/95 px-5 py-5 shadow-lg shadow-black/20 sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-sky-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">InfinityPainel</p>
                <p className="text-sm text-slate-400">Proteção, transparência e suporte em um só lugar.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTerms({ title: "Política de Privacidade", content: <TermsContent terms={privacyPolicySections} /> })}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300"
            >
              <FileText className="h-4 w-4" />
              Política de Privacidade
            </button>
            <button
              type="button"
              onClick={() => setActiveTerms({ title: "Termos Financeiros", content: <TermsContent terms={financialTermsSections} /> })}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300"
            >
              <FileText className="h-4 w-4" />
              Termos Financeiros
            </button>

            <div className="ml-0 flex items-center gap-2 sm:ml-2">
              <SocialIconLink href={discordUrl} label="Abrir Discord">
                <MessageCircleMore className="h-4 w-4" />
              </SocialIconLink>
              <SocialIconLink href={instagramUrl} label="Abrir Instagram">
                <Instagram className="h-4 w-4" />
              </SocialIconLink>
            </div>
          </div>
        </div>
      </footer>

      <TermsModal
        isOpen={Boolean(activeTerms)}
        onClose={() => setActiveTerms(null)}
        title={activeTerms?.title || ""}
        content={activeTerms?.content || null}
      />
    </>
  );
}
