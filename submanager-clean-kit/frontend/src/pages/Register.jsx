import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../services/api.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/register", { username: form.username, email: form.email, password: form.password }, { auth: false });
      toast.success("Conta criada.");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-10 text-slate-950 lg:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em]">InfinityPainel</p>
              <h1 className="mt-6 max-w-md text-5xl font-black leading-tight">
                Crie sua conta e comece a administrar seus planos.
              </h1>
            </div>
            <p className="max-w-md text-base font-medium text-slate-900/80">
              Cadastre-se para acessar planos, assinaturas e recursos de gestão em um só lugar.
            </p>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm text-slate-400">Cadastro</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Criar conta</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Nome</span>
                  <input
                    type="text"
                    required
                    className="field"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                    placeholder="Seu username"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">E-mail</span>
                  <input
                    type="email"
                    required
                    className="field"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="seuemail@exemplo.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Senha</span>
                  <input
                    type="password"
                    required
                    className="field"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Crie uma senha"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </form>

              <p className="mt-6 text-sm text-slate-400">
                Já tem conta?{" "}
                <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
