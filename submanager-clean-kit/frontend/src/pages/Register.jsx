import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../services/api.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post(
        "/auth/register",
        {
          username: form.username,
          email: form.email,
          password: form.password,
        },
        { auth: false }
      );

      toast.success("Conta criada.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Não foi possível criar a conta."
      );
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
          <div className="auth-hero">
            <div>
              <div className="auth-badge">InfinityPainel</div>
              <h1 className="auth-title">
                Crie sua conta e acesse a plataforma.
              </h1>
              <p className="auth-text">
                Cadastro direto para entrar no sistema e seguir com o fluxo da
                sua conta.
              </p>
            </div>
          </div>

          <div className="auth-panel">
            <div style={{ width: "100%", maxWidth: 430 }}>
              <div style={{ marginBottom: 28 }}>
                <div className="auth-section-label">Cadastro</div>
                <h2 className="auth-panel-title">Criar conta</h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="auth-label">Nome de usuário</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="Digite seu username"
                    className="auth-input"
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span className="auth-label">E-mail</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Digite seu e-mail"
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
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Crie uma senha"
                    className="auth-input"
                  />
                </label>

                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </form>

              <p className="auth-footer-text">
                Já tem conta?{" "}
                <Link to="/login" className="auth-link">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          overflow: hidden;
          border-radius: 36px;
          border: 1px solid #1f2937;
          background: linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }

        .auth-hero {
          padding: 48px 42px;
          background: linear-gradient(135deg, rgba(99,102,241,0.96) 0%, rgba(79,70,229,0.95) 55%, rgba(109,40,217,0.92) 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 620px;
        }

        .auth-badge {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }

        .auth-title {
          margin: 28px 0 0;
          font-size: 48px;
          line-height: 1.05;
          font-weight: 900;
          max-width: 430px;
        }

        .auth-text {
          margin: 22px 0 0;
          max-width: 430px;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,0.84);
        }

        .auth-panel {
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-section-label {
          color: #9ca3af;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .auth-panel-title {
          margin: 10px 0 0;
          font-size: 34px;
          line-height: 1.08;
          font-weight: 900;
          color: #f3f4f6;
        }

        .auth-label {
          font-size: 14px;
          font-weight: 700;
          color: #e5e7eb;
        }

        .auth-input {
          height: 54px;
          border-radius: 18px;
          border: 1px solid #1f2937;
          background: rgba(255,255,255,0.03);
          color: #f3f4f6;
          padding: 0 16px;
          outline: none;
          width: 100%;
        }

        .auth-submit {
          height: 54px;
          border-radius: 18px;
          border: 1px solid rgba(99,102,241,0.55);
          background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(99,102,241,0.22);
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer-text {
          margin-top: 20px;
          color: #9ca3af;
          font-size: 14px;
          line-height: 1.6;
        }

        .auth-link {
          color: #818cf8;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .auth-grid {
            grid-template-columns: 1fr;
          }

          .auth-hero {
            min-height: auto;
            padding: 28px 24px;
          }

          .auth-title {
            font-size: 32px;
          }

          .auth-text {
            font-size: 14px;
          }

          .auth-panel {
            padding: 28px 20px;
          }
        }

        @media (max-width: 560px) {
          .auth-grid {
            border-radius: 24px;
          }

          .auth-hero {
            padding: 22px 18px;
          }

          .auth-panel {
            padding: 22px 16px;
          }

          .auth-title {
            font-size: 28px;
          }

          .auth-panel-title {
            font-size: 28px;
          }

          .auth-input,
          .auth-submit {
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
}