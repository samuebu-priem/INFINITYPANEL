import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  FileText,
  Users,
  User,
  Trophy,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/auth.jsx";

export default function AppShell({ children, showHeader = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  const discordInviteUrl = import.meta.env.VITE_DISCORD_INVITE_URL || "";
  const showDiscordLink = Boolean(discordInviteUrl);

  const links = [
    ...(isAdmin
      ? [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }]
      : [{ to: "/dashboard", label: "Início", icon: Home }]),

    { to: "/profile", label: "Perfil", icon: User },

    ...(isAdmin
      ? [{ to: "/ranking", label: "Ranking público", icon: Trophy }]
      : []),

    ...(isAdmin ? [{ to: "/plans", label: "Planos", icon: FileText }] : []),

    ...(isAdmin
      ? [{ to: "/admin/subscribers", label: "Usuários", icon: Users }]
      : []),

    ...(isAdmin
      ? [{ to: "/admin/mediators", label: "Mediadores", icon: Trophy }]
      : []),

    { to: "/termos-de-uso", label: "Termos", icon: FileText },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#f3f4f6",
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.12) 0%, rgba(11,15,20,0) 34%), #0b0f14",
      }}
    >
      {showHeader ? (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            borderBottom: "1px solid #1f2937",
            background: "rgba(11, 15, 20, 0.88)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "18px 24px",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 18,
                  border: "1px solid #1f2937",
                  background:
                    "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
                  boxShadow: "0 0 24px rgba(99,102,241,0.16)",
                  color: "#6366f1",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} />
              </div>
            </div>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
                minWidth: 0,
              }}
            >
              {links.map((link) => {
                const Icon = link.icon;

                const active =
                  location.pathname === link.to ||
                  location.pathname.startsWith(`${link.to}/`);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "11px 14px",
                      borderRadius: 16,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                      border: active
                        ? "1px solid rgba(99,102,241,0.5)"
                        : "1px solid #1f2937",
                      color: active ? "#c7d2fe" : "#e5e7eb",
                      background: active
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(18,24,33,0.92)",
                      boxShadow: active
                        ? "0 0 24px rgba(99,102,241,0.14)"
                        : "none",
                      transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {showDiscordLink ? (
              <a
                href={discordInviteUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Entrar no Discord"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 16px",
                  borderRadius: 18,
                  border: "1px solid rgba(88,101,242,0.28)",
                  background:
                    "linear-gradient(180deg, rgba(88,101,242,0.18) 0%, rgba(17,24,39,0.96) 100%)",
                  color: "#dbeafe",
                  textDecoration: "none",
                  boxShadow: "0 0 28px rgba(88,101,242,0.14)",
                  transition:
                    "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.borderColor = "rgba(88,101,242,0.42)";
                  e.currentTarget.style.boxShadow = "0 0 34px rgba(88,101,242,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(88,101,242,0.28)";
                  e.currentTarget.style.boxShadow = "0 0 28px rgba(88,101,242,0.14)";
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(88,101,242,0.16)",
                    border: "1px solid rgba(88,101,242,0.24)",
                    color: "#c7d2fe",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
                  }}
                >
                  <MessageCircle size={17} />
                </span>

                <span
                  style={{
                    display: "grid",
                    lineHeight: 1.1,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800 }}>Discord</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#93c5fd",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Comunidade
                    <ExternalLink size={12} />
                  </span>
                </span>
              </a>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.14)",
                  color: "#fecaca",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}
