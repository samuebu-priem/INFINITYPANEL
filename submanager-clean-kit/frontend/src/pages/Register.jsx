import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import ActionButton from "../components/ui/ActionButton";

const API_BASE = "/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao criar conta.");
      }

      const token = data?.token || data?.accessToken || data?.data?.token;
      if (token) {
        localStorage.setItem("submanager_token", token);
      }

      navigate("/user-home");
    } catch (error) {
      setError(error?.message || "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="auth-page">
        <SectionCard
          className="auth-card"
          title="Criar conta"
          subtitle="Cadastre seus dados para continuar."
        >
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-field__label">Nome</span>
              <input
                className="auth-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">E-mail</span>
              <input
                className="auth-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">Senha</span>
              <input
                className="auth-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </label>

            {error ? <div className="auth-error">{error}</div> : null}

            <ActionButton variant="primary" type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </ActionButton>
          </form>

          <p className="auth-footer">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
