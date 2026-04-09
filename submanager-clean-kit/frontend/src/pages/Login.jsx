import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/auth.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login({
        emailOrUsername: form.email,
        password: form.password,
      });
      toast.success("Login realizado.");
      navigate(response?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] px-4 py-10 text-[#f3f4f6]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-[#1f2937] bg-[#121821] shadow-2xl shadow-black/40 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-10 text-white lg:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">SubManager</p>
              <h1 className="mt-6 max-w-md text-5xl font-black leading-tight">
                Entre para gerenciar seus planos e assinaturas.
              </h1>
            </div>
            <p className="max-w-md text-base font-medium text-white/80">
              Acesso autenticado para visualizar planos e acompanhar a área da conta.
            </p>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm text-[#9ca3af]">Acesso</p>
                <h2 className="mt-2 text-3xl font-bold text-[#f3f4f6]">Entrar</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#e5e7eb]">E-mail ou usuário</span>
                  <input
                    type="text"
                    required
                    className="field"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="seuemail@exemplo.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#e5e7eb]">Senha</span>
                  <input
                    type="password"
                    required
                    className="field"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Sua senha"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="mt-6 text-sm text-[#9ca3af]">
                Não tem conta?{" "}
                <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Criar conta
                </Link>
              </p>
              <p className="mt-3 text-xs leading-5 text-[#6b7280]">
                Ao entrar, você concorda com os{" "}
                <Link to="/termos-de-uso" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/politica-de-privacidade" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}