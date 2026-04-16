

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  LogOut,
  Trophy,
  User,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../context/auth.jsx";

export default function AppShell({ children, showHeader = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  const discordUrl = import.meta.env.VITE_DISCORD_INVITE_URL;

  const links = [
    ...(isAdmin
      ? [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }]
      : [{ to: "/dashboard", label: "Lobby", icon: Home }]),

    { to: "/profile", label: "Perfil", icon: User },

    ...(isAdmin
      ? [{ to: "/ranking", label: "Ranking", icon: Trophy }]
      : []),
  ];

  return (
    <div className="min-h-screen text-white bg-[#0b0f14]">

      {showHeader && (
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0b0f14]/90 backdrop-blur">

          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

            {/* LOGO + USER */}
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
                ∞
              </div>

              <div>
                <p className="text-sm text-zinc-400">
                  Infinity
                </p>
                <p className="text-sm font-bold">
                  {user?.username}
                </p>
              </div>

            </div>

            {/* NAV */}
            <div className="flex items-center gap-2">

              {links.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition
                      ${active
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                  >
                    <Icon size={14} />
                    {link.label}
                  </Link>
                );
              })}

            </div>

            {/* AÇÕES */}
            <div className="flex items-center gap-2">

              {/* DISCORD */}
              {discordUrl && (
                <a
                  href={discordUrl}
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-sm font-bold"
                >
                  <MessageCircle size={14} />
                  Discord
                </a>
              )}

              {/* LOGOUT */}
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-sm font-bold"
              >
                <LogOut size={14} />
              </button>

            </div>

          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

    </div>
  );
}