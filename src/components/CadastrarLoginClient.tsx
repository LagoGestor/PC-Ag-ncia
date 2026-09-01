"use client";

import { FormEvent, useEffect, useState } from "react";
import { RESPONSAVEIS_VISIVEIS } from "@/types";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ConfirmModal } from "./ConfirmModal";

type Nivel = "MASTER" | "MASTER_LEITURA" | "RESPONSAVEL_MASTER" | "RESPONSAVEL_LEITURA";

const NIVEL_LABEL: Record<Nivel, string> = {
  MASTER: "Master",
  MASTER_LEITURA: "Master Leitura",
  RESPONSAVEL_MASTER: "Responsável Master",
  RESPONSAVEL_LEITURA: "Responsável Leitura",
};

interface Usuario {
  id: string;
  login: string;
  nivel: Nivel;
  responsavel: string;
  createdAt: string;
}

const empty = { login: "", senha: "", nivel: "MASTER" as Nivel, responsavel: "" };

export function CadastrarLoginClient() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const { toasts, toast } = useToasts();

  const isResponsavelScoped = form.nivel === "RESPONSAVEL_MASTER" || form.nivel === "RESPONSAVEL_LEITURA";

  function carregar() {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then(setUsuarios)
      .catch(() => toast("Erro ao carregar logins", "error"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.login.trim() || !form.senha) {
      setError("Preencha login e senha.");
      return;
    }
    if (isResponsavelScoped && !form.responsavel) {
      setError("Selecione o responsável.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar login.");
        return;
      }
      setForm(empty);
      toast(`Login "${data.login}" criado!`, "success");
      carregar();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/usuarios/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Erro ao apagar login", "error");
      } else {
        toast("Login apagado", "info");
        carregar();
      }
    } catch {
      toast("Erro ao apagar login", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="cadastrar-login-shell">
      <h1 className="fixas-title">Cadastrar Login</h1>
      <p className="fixas-subtitle">Gerencie os acessos ao sistema. Esta página é restrita a contas Master.</p>

      <form className="cadastrar-login-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              Login <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={form.login}
              onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Senha <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Nível de acesso <span>*</span>
            </label>
            <select
              className="form-control"
              value={form.nivel}
              onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value as Nivel, responsavel: "" }))}
            >
              {(Object.keys(NIVEL_LABEL) as Nivel[]).map((n) => (
                <option key={n} value={n}>
                  {NIVEL_LABEL[n]}
                </option>
              ))}
            </select>
          </div>
          {isResponsavelScoped && (
            <div className="form-group">
              <label>
                Responsável <span>*</span>
              </label>
              <select
                className="form-control"
                value={form.responsavel}
                onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {RESPONSAVEIS_VISIVEIS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <button type="submit" className="btn btn-accent" disabled={saving}>
          <i className="fas fa-user-plus" /> {saving ? "Criando..." : "Criar login"}
        </button>
      </form>

      <h2 className="fixas-title" style={{ fontSize: 16, marginTop: 34 }}>
        Logins cadastrados
      </h2>

      <div className="cadastrar-login-list">
        {usuarios === null ? (
          <p className="mobile-empty">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="mobile-empty">Nenhum login cadastrado.</p>
        ) : (
          usuarios.map((u) => (
            <div key={u.id} className="cadastrar-login-row">
              <div>
                <div className="cadastrar-login-row-login">{u.login}</div>
                <div className="cadastrar-login-row-meta">
                  {NIVEL_LABEL[u.nivel]}
                  {u.responsavel ? ` · ${u.responsavel}` : ""}
                </div>
              </div>
              <button className="card-action-btn danger" onClick={() => setDeleteTarget(u)} title="Apagar login">
                <i className="fas fa-trash" />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Apagar login?"
        text={`O login "${deleteTarget?.login}" perderá o acesso ao sistema imediatamente.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
