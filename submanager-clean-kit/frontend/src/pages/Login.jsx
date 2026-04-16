import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/auth.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login({
        emailOrUsername: form.emailOrUsername,
        password: form.password,
      });

      toast.success("Acesso realizado com sucesso.");

      const role = response?.user?.role;

      if (role === "ADMIN" || role === "OWNER") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.12) 0%, rgba(11,15,20,0) 34%), #0b0f14",
        color: "#f3f4f6",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          minHeight: "calc(100vh - 32px)",
          display: "grid",
          alignItems: "center",
        }}
      >
        <div className="auth-grid">
          {/* LADO VISUAL */}
          <div className="auth-hero">
            <div>
              <div className="auth-badge">InfinityPainel</div>
              <h1 className="auth-title">
                Entre na sua conta e acompanhe tudo em um só lugar.
              </h1>
              <p className="auth-text">
                Acesse seus planos, sua presença na comunidade e seu progresso.
              </p>
            </div>
          </div>

          {/* FORM */}
          <div className="auth-panel">
            <div style={{ width: "100%", maxWidth: 430 }}>
              <div style={{ marginBottom: 28 }}>
                <div className="auth-section-label">Acesso</div>
                <h2 className="auth-panel-title">Entrar</h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="auth-label">E-mail ou usuário</span>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    required
                    autoComplete="username"
                    value={form.emailOrUsername}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        emailOrUsername: event.target.value,
                      }))
                    }
                    placeholder="Digite seu e-mail ou usuário"
                    className="auth-input"
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span className="auth-label">Senha</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Digite sua senha"
                    className="auth-input"
                  />
                </label>

                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="auth-footer-text">
                Não tem conta?{" "}
                <Link to="/register" className="auth-link">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        .auth-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          border-radius: 36px;
          overflow: hidden;
          border: 1px solid #1f2937;
          background: linear-gradient(180deg, rgba(18,24,33,0.98), rgba(11,15,20,0.98));
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }

        .auth-hero {
          padding: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5, #6d28d9);
          display: flex;
          align-items: center;
          color: white;
        }

        .auth-badge {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .auth-title {
          margin-top: 20px;
          font-size: 42px;
          font-weight: 900;
          line-height: 1.1;
        }

        .auth-text {
          margin-top: 16px;
          opacity: 0.85;
        }

        .auth-panel {
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-panel-title {
          font-size: 32px;
          font-weight: 900;
        }

        .auth-label {
          font-size: 14px;
          font-weight: 600;
        }

        .auth-input {
          height: 52px;
          border-radius: 16px;
          border: 1px solid #1f2937;
          background: rgba(255,255,255,0.04);
          color: #fff;
          padding: 0 14px;
        }

        .auth-submit {
          height: 52px;
          border-radius: 16px;
          border: none;
          background: #6366f1;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .auth-footer-text {
          margin-top: 20px;
          font-size: 14px;
          color: #9ca3af;
        }

        .auth-link {
          color: #818cf8;
          font-weight: 700;
        }

        /* MOBILE */
        @media (max-width: 900px) {
          .auth-grid {
            grid-template-columns: 1fr;
          }

          .auth-hero {
            padding: 24px;
          }

          .auth-title {
            font-size: 28px;
          }

          .auth-panel {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}