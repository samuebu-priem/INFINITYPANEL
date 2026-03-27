import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";

function getHomePath(role) {
  if (role === "ADMIN" || role === "OWNER") return "/admin";
  return "/home";
}

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user?.role) navigate(getHomePath(user.role), { replace: true });
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await login({ emailOrUsername, password });
      const nextRole = data?.user?.role ?? user?.role;
      toast.success(`Bem-vindo, ${data?.user?.username ?? "usuário"}.`);
      navigate(getHomePath(nextRole), { replace: true });
    } catch (err) {
      toast.error(err?.message || "Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(7,16,34,0.98),rgba(2,6,23,0.98))] p-8 shadow-2xl shadow-black/25 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-400">Infinity Painel</p>
            <h1 className="mt-4 max-w-lg text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Acesse sua conta com uma experiência mais limpa e profissional.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Entre para acompanhar seus planos, acessar o painel e gerenciar suas assinaturas com visual consistente
              e navegação objetiva.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Login</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Entrar no sistema</h2>
              <p className="mt-2 text-slate-400">Use seu e-mail ou usuário e a senha cadastrada.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-mail ou usuário</label>
                <input
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="field"
                  placeholder="seuemail@exemplo.com ou usuario"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>

              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white transition hover:bg-sky-500">
                <LogIn className="h-4 w-4" />
                Entrar
              </button>
            </form>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Criar conta
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
