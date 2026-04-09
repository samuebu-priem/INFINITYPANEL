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
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          minHeight: "calc(100vh - 48px)",
          display: "grid",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            overflow: "hidden",
            borderRadius: 36,
            border: "1px solid #1f2937",
            background:
              "linear-gradient(180deg, rgba(18,24,33,0.98) 0%, rgba(11,15,20,0.98) 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              padding: "48px 42px",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.96) 0%, rgba(79,70,229,0.95) 55%, rgba(109,40,217,0.92) 100%)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 620,
            }}
            className="register-hero"
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                InfinityPainel
              </div>

              <h1
                style={{
                  margin: "28px 0 0",
                  fontSize: 48,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  maxWidth: 430,
                }}
              >
                Crie sua conta e acesse a plataforma.
              </h1>

              <p
                style={{
                  margin: "22px 0 0",
                  maxWidth: 430,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.84)",
                }}
              >
                Cadastro direto para entrar no sistema e seguir com o fluxo da
                sua conta.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                marginTop: 40,
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Cadastro rápido
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  Nome de usuário, e-mail e senha.
                </div>
              </div>

              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Entrada liberada
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  Depois do cadastro, é só entrar na tela de login.
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "48px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 430 }}>
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Cadastro
                </div>

                <h2
                  style={{
                    margin: "10px 0 0",
                    fontSize: 34,
                    lineHeight: 1.08,
                    fontWeight: 900,
                    color: "#f3f4f6",
                  }}
                >
                  Criar conta
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                <label style={{ display: "grid", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#e5e7eb",
                    }}
                  >
                    Nome de usuário
                  </span>

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
                    style={{
                      height: 54,
                      borderRadius: 18,
                      border: "1px solid #1f2937",
                      background: "rgba(255,255,255,0.03)",
                      color: "#f3f4f6",
                      padding: "0 16px",
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#e5e7eb",
                    }}
                  >
                    E-mail
                  </span>

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
                    style={{
                      height: 54,
                      borderRadius: 18,
                      border: "1px solid #1f2937",
                      background: "rgba(255,255,255,0.03)",
                      color: "#f3f4f6",
                      padding: "0 16px",
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#e5e7eb",
                    }}
                  >
                    Senha
                  </span>

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
                    style={{
                      height: 54,
                      borderRadius: 18,
                      border: "1px solid #1f2937",
                      background: "rgba(255,255,255,0.03)",
                      color: "#f3f4f6",
                      padding: "0 16px",
                      outline: "none",
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 54,
                    borderRadius: 18,
                    border: "1px solid rgba(99,102,241,0.55)",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    boxShadow: "0 0 30px rgba(99,102,241,0.22)",
                  }}
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </form>

              <p
                style={{
                  marginTop: 20,
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Já tem conta?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#818cf8",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .register-hero {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}