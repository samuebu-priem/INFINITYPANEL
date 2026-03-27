import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";
import TermsModal from "@/components/ui/TermsModal";
import { financialTerms, privacyTerms } from "@/lib/terms";

function getHomePath(role) {
  if (role === "ADMIN" || role === "OWNER") return "/admin";
  return "/home";
}

function TermsContent({ items }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <section key={item.title} className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="text-sm leading-7 text-slate-300">{item.body}</p>
        </section>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptFinancial, setAcceptFinancial] = useState(false);
  const [activeTerms, setActiveTerms] = useState(null);
  const needsNickname = true;

  useEffect(() => {
    if (user?.role) navigate(getHomePath(user.role), { replace: true });
  }, [navigate, user]);

  const canSubmit = useMemo(
    () => Boolean(email && username && password && acceptPrivacy && acceptFinancial && (!needsNickname || nickname)),
    [acceptFinancial, acceptPrivacy, email, needsNickname, nickname, password, username],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!acceptPrivacy || !acceptFinancial) {
      toast.error("É necessário aceitar os Termos de Privacidade e os Termos Financeiros para concluir o cadastro.");
      return;
    }

    try {
      const data = await register({
        email,
        username,
        password,
        role: "PLAYER",
        nickname: needsNickname ? nickname : undefined,
        acceptPrivacyTerms: true,
        acceptFinancialTerms: true,
      });

      toast.success(`Conta criada: ${data?.user?.username ?? "usuário"}`);
      navigate(getHomePath(data?.user?.role ?? user?.role), { replace: true });
    } catch (err) {
      toast.error(err?.message || "Não foi possível criar a conta.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(7,162,235,0.12),transparent_36%),linear-gradient(180deg,rgba(7,16,34,0.98),rgba(2,6,23,0.98))] p-8 shadow-2xl shadow-black/25 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-400">SubManager Clean</p>
            <h1 className="mt-4 max-w-lg text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Crie sua conta com um cadastro claro, seguro e profissional.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              O registro exige aceite dos termos de privacidade e das regras financeiras para garantir transparência
              no uso da plataforma, nos pagamentos e no acesso à assinatura.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Cadastro seguro", text: "Proteção dos dados e autenticação." },
                { icon: FileText, title: "Termos claros", text: "Regras objetivas para uso e cobrança." },
                { icon: BookOpen, title: "Visual limpo", text: "Leitura simples e apresentação profissional." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <Icon className="h-5 w-5 text-sky-400" />
                    <h2 className="mt-3 text-sm font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Registro</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Criar conta</h2>
              <p className="mt-2 text-slate-400">Preencha os dados abaixo para acessar a plataforma.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-mail</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                  placeholder="seuemail@exemplo.com"
                  type="email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Usuário</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="field"
                  placeholder="seu_usuario"
                  autoComplete="username"
                />
              </div>

              {needsNickname && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nickname</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="field"
                    placeholder="Nome exibido no perfil"
                    autoComplete="nickname"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  placeholder="Crie uma senha segura"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="accept-privacy"
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="accept-privacy" className="text-sm font-medium text-white">
                      Aceito os Termos de Privacidade
                    </label>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Leia as regras sobre tratamento e uso dos dados cadastrais.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTerms("privacy")}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition hover:text-sky-300"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Visualizar termos
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-800 pt-4">
                  <input
                    id="accept-financial"
                    type="checkbox"
                    checked={acceptFinancial}
                    onChange={(e) => setAcceptFinancial(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="accept-financial" className="text-sm font-medium text-white">
                      Aceito os Termos Financeiros
                    </label>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Entenda as regras de assinatura, cobrança, renovação e cancelamento.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTerms("financial")}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition hover:text-sky-300"
                    >
                      <FileText className="h-4 w-4" />
                      Visualizar termos
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="w-full rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSubmit}
                type="submit"
              >
                Criar conta
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Voltar para login
            </button>
          </section>
        </div>
      </div>

      <TermsModal
        open={activeTerms === "privacy"}
        title="Termos de Privacidade"
        content={<TermsContent items={privacyTerms} />}
        onClose={() => setActiveTerms(null)}
      />

      <TermsModal
        open={activeTerms === "financial"}
        title="Termos Financeiros"
        content={<TermsContent items={financialTerms} />}
        onClose={() => setActiveTerms(null)}
      />
    </div>
  );
}
