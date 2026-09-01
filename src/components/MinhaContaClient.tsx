"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";

interface Props {
  nomeInicial: string;
  loginInicial: string;
  nivelLabel: string;
}

export function MinhaContaClient({ nomeInicial, loginInicial, nivelLabel }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [login, setLogin] = useState(loginInicial);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { toasts, toast } = useToasts();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !login.trim()) {
      setError("Preencha nome e login.");
      return;
    }
    if (senha && senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, login, senha: senha || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      toast("Dados atualizados!", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cadastrar-login-shell">
      <h1 className="fixas-title">Alterar Senha</h1>
      <p className="fixas-subtitle">Atualize seu nome, login ou senha. O nível de acesso só pode ser alterado por um Master.</p>

      <form className="cadastrar-login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Nome <span>*</span>
          </label>
          <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>
            Login <span>*</span>
          </label>
          <input type="text" className="form-control" value={login} onChange={(e) => setLogin(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Nível de acesso</label>
          <input type="text" className="form-control" value={nivelLabel} disabled />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nova senha</label>
            <input
              type="text"
              className="form-control"
              placeholder="Deixe em branco para manter a atual"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirmar nova senha</label>
            <input
              type="text"
              className="form-control"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>
        </div>

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <div className="form-footer">
          <Link href="/" className="btn btn-ghost">
            Voltar
          </Link>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            <i className="fas fa-save" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
