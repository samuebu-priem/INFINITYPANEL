import { Link } from "react-router-dom";
import { LogOut, LayoutDashboard, Home } from "lucide-react";
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
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">SEJA BEM VINDO AO PAINEL DA INFINITY</p>
            <h1 className="text-lg font-bold">Painel de Assinaturas</h1>
          </div>

          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
