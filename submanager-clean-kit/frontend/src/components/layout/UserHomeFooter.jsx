import { Instagram, MessageCircleMore, Shield, FileText } from "lucide-react";
import { useState } from "react";
import {
  financialTermsSections,
  privacyPolicySections,
  termsOfUseSections,
} from "../../lib/terms.js";
import { TermsModal } from "../ui/TermsModal.jsx";

function TermsContent({ terms }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {terms.map((term) => (
        <section key={term.title}>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: "#f3f4f6",
            }}
          >
            {term.title}
          </h3>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.8,
              color: "#d1d5db",
            }}
          >
            {term.body}
          </p>
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
      style={{
        display: "inline-flex",
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        border: "1px solid rgba(99,102,241,0.18)",
        background: "linear-gradient(180deg, rgba(99,102,241,0.10) 0%, rgba(255,255,255,0.03) 100%)",
        color: "#c7d2fe",
        textDecoration: "none",
        boxShadow: "0 0 22px rgba(99,102,241,0.10)",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.32)";
        event.currentTarget.style.boxShadow = "0 0 28px rgba(99,102,241,0.18)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
        event.currentTarget.style.boxShadow = "0 0 22px rgba(99,102,241,0.10)";
      }}
    >
      {children}
    </a>
  );
}

export function UserHomeFooter({ discordUrl, instagramUrl }) {
  const [activeTerms, setActiveTerms] = useState(null);

  return (
    <>
      <footer
        style={{
          marginTop: 6,
          borderRadius: 28,
          border: "1px solid rgba(99,102,241,0.16)",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          padding: "20px 22px",
          boxShadow: "0 14px 32px rgba(0,0,0,0.20)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 35%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 16,
                  border: "1px solid rgba(99,102,241,0.20)",
                  background: "rgba(99,102,241,0.08)",
                  color: "#c7d2fe",
                  boxShadow: "0 0 24px rgba(99,102,241,0.16)",
                }}
              >
                <Shield size={16} />
              </div>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#818cf8",
                  }}
                >
                  InfinityPainel
                </p>

                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 14,
                    color: "#9ca3af",
                  }}
                >
                  Proteção, transparência e suporte em um só lugar.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setActiveTerms({
                    title: "Política de Privacidade",
                    content: <TermsContent terms={privacyPolicySections} />,
                  })
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(99,102,241,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e5e7eb",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.30)";
                  event.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.10)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
                  event.currentTarget.style.boxShadow = "none";
                }}
              >
                <FileText size={16} />
                Política de Privacidade
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTerms({
                    title: "Termos Financeiros",
                    content: <TermsContent terms={financialTermsSections} />,
                  })
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(99,102,241,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e5e7eb",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.30)";
                  event.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.10)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
                  event.currentTarget.style.boxShadow = "none";
                }}
              >
                <FileText size={16} />
                Termos Financeiros
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTerms({
                    title: "Termos de Uso",
                    content: <TermsContent terms={termsOfUseSections} />,
                  })
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(99,102,241,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e5e7eb",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.30)";
                  event.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.10)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.borderColor = "rgba(99,102,241,0.18)";
                  event.currentTarget.style.boxShadow = "none";
                }}
              >
                <FileText size={16} />
                Termos de Uso
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <SocialIconLink href={discordUrl} label="Abrir Discord">
                  <MessageCircleMore size={16} />
                </SocialIconLink>

                <SocialIconLink href={instagramUrl} label="Abrir Instagram">
                  <Instagram size={16} />
                </SocialIconLink>
              </div>
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