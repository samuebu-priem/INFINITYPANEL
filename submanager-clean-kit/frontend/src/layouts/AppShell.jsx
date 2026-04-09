import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  FileText,
  Users,
} from "lucide-react";
import { useAuth } from "../context/auth.jsx";

export default function AppShell({ children, showHeader = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  const links = [
    ...(isAdmin
      ? [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }]
      : [{ to: "/user-home", label: "Início", icon: Home }]),
    ...(isAdmin ? [{ to: "/plans", label: "Planos", icon: FileText }] : []),
    ...(isAdmin
      ? [{ to: "/admin/subscribers", label: "Assinaturas", icon: Users }]
      : []),
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
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
                }}
              >
                <ShieldCheck size={20} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#818cf8",
                    marginBottom: 4,
                  }}
                >
                  InfinityPainel
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#f3f4f6",
                  }}
                >
                  Painel
                </div>
              </div>
            </div>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
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
                    }}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}

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
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </nav>
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