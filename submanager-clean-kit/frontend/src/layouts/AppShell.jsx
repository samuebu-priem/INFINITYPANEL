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
      : [{ to: "/dashboard", label: "Lobby", icon: Home }]),

    { to: "/profile", label: "Perfil", icon: User },

    ...(isAdmin
      ? [
          { to: "/ranking", label: "Ranking", icon: Trophy },
          { to: "/plans", label: "Planos", icon: FileText },
          { to: "/admin/subscribers", label: "Usuários", icon: Users },
          { to: "/admin/mediators", label: "Mediadores", icon: ShieldCheck },
        ]
      : []),

    { to: "/termos-de-uso", label: "Termos", icon: FileText },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#f3f4f6",
        background:
          "radial-gradient(circle at top, rgba(88,101,242,0.10) 0%, rgba(11,15,20,0) 34%), #0b0f14",
      }}
    >
      {showHeader ? (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(11, 15, 20, 0.88)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "16px 24px",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 16,
                  border: "1px solid rgba(88,101,242,0.22)",
                  background:
                    "linear-gradient(180deg, rgba(88,101,242,0.18) 0%, rgba(17,24,39,0.96) 100%)",
                  boxShadow: "0 0 22px rgba(88,101,242,0.14)",
                  color: "#c7d2fe",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#f8fafc",
                    fontSize: 15,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  InfinityPainel
                </div>

                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    marginTop: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 180,
                  }}
                >
                  {isAdmin ? "Staff / Controle" : "Área do jogador"}
                </div>
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
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: "none",
                      border: active
                        ? "1px solid rgba(88,101,242,0.42)"
                        : "1px solid rgba(255,255,255,0.06)",
                      color: active ? "#e0e7ff" : "#d1d5db",
                      background: active
                        ? "rgba(88,101,242,0.14)"
                        : "rgba(255,255,255,0.03)",
                      boxShadow: active
                        ? "0 0 22px rgba(88,101,242,0.14)"
                        : "none",
                      transition:
                        "transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease",
                      whiteSpace: "nowrap",
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
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
                    padding: "11px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(88,101,242,0.28)",
                    background:
                      "linear-gradient(180deg, rgba(88,101,242,0.18) 0%, rgba(17,24,39,0.96) 100%)",
                    color: "#dbeafe",
                    textDecoration: "none",
                    boxShadow: "0 0 22px rgba(88,101,242,0.14)",
                    transition:
                      "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.borderColor = "rgba(88,101,242,0.42)";
                    e.currentTarget.style.boxShadow = "0 0 28px rgba(88,101,242,0.20)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(88,101,242,0.28)";
                    e.currentTarget.style.boxShadow = "0 0 22px rgba(88,101,242,0.14)";
                  }}
                >
                  <MessageCircle size={16} />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Discord
                    <ExternalLink size={12} />
                  </span>
                </a>
              ) : null}

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
                  borderRadius: 14,
                  border: "1px solid rgba(239,68,68,0.28)",
                  background: "rgba(239,68,68,0.12)",
                  color: "#fecaca",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition:
                    "transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease",
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