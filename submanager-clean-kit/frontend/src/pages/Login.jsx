import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { seedStorage } from "@/lib/storage";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  seedStorage();

  useEffect(() => {
    if (user) navigate(user.role === "ADMIN" ? "/admin" : "/home");
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await login({ emailOrUsername, password });
      toast.success(`Bem-vindo, ${data?.user?.username ?? "usuário"}.`);
      navigate(data?.user?.role === "ADMIN" ? "/admin" : "/home");
    } catch (err) {
      toast.error(err?.message || "Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/30">
        <p className="text-sky-400 text-sm font-medium">Infinity Painel</p>
        <h1 className="text-3xl font-bold mt-2">Entrar no sistema</h1>


        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <div>
            <label className="text-sm text-slate-400">E-mail ou usuário</label>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <button className="w-full rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3 font-semibold">
            Entrar
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold"
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
