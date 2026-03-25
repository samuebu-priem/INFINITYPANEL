import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";

export default function Register() {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const needsNickname = true;

  useEffect(() => {
    if (user) navigate(user.role === "ADMIN" ? "/admin" : "/home");
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await register({
        email,
        username,
        password,
        role: "PLAYER",
        nickname: needsNickname ? nickname : undefined,
      });

      toast.success(`Conta criada: ${data?.user?.username ?? "usuário"}`);
      navigate(data?.user?.role === "ADMIN" ? "/admin" : "/home");
    } catch (err) {
      toast.error(err?.message || "Não foi possível criar a conta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/30">
        <p className="text-sky-400 text-sm font-medium">SubManager Clean</p>
        <h1 className="text-3xl font-bold mt-2">Criar conta</h1>
        <p className="text-slate-400 mt-2">Cadastro usando a API real do backend.</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <div>
            <label className="text-sm text-slate-400">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Usuário</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          {needsNickname && (
            <div>
              <label className="text-sm text-slate-400">Nickname</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>
          )}

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
            Criar conta
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 w-full rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
}
