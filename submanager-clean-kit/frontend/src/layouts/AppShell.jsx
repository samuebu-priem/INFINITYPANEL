import { Link } from "react-router-dom";
import { Home, LayoutDashboard, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();

  const links = [
    ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }] : []),
    ...(user?.role ? [{ to: "/home", label: "Início", icon: Home }] : []),
    ...(["ADMIN", "OWNER"].includes(user?.role) ? [{ to: "/plans", label: "Planos", icon: LayoutDashboard }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">Infinity Painel</p>
              <h1 className="text-lg font-bold text-white">Painel de Assinaturas</h1>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:border-slate-700 hover:bg-slate-700"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
