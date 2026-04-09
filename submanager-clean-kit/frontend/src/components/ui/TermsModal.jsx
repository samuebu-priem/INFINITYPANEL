import { X } from "lucide-react";

export function TermsModal({ isOpen, onClose, title, content }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "rgba(2,6,23,0.85)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          borderRadius: 30,
          border: "1px solid #1f2937",
          background:
            "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid #1f2937",
            padding: "20px 22px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
              color: "#f3f4f6",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 42,
              height: 42,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              border: "1px solid #1f2937",
              background: "rgba(255,255,255,0.03)",
              color: "#d1d5db",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            padding: "22px",
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}