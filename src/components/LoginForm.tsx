"use client";

import { FormEvent, useState } from "react";
import { slugify } from "@/types";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, senha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.nivel === "EXECUTOR" && data.responsavel) {
        window.location.href = `/mobile/${slugify(data.responsavel)}`;
      } else {
        window.location.href = nextPath || "/";
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/icone_logo_agencia.png" alt="Agência LBC" />
          <span>Agência LBC</span>
        </div>

        <div className="form-group">
          <label>Login</label>
          <input
            type="text"
            className="form-control"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn btn-accent login-submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
