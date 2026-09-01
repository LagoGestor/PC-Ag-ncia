"use client";

import { FormEvent, useEffect, useState } from "react";
import { RESPONSAVEIS_VISIVEIS } from "@/types";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ConfirmModal } from "./ConfirmModal";

type Nivel = "MASTER" | "DIRETOR_CONTEUDO" | "EXECUTOR";

const NIVEL_LABEL: Record<Nivel, string> = {
  MASTER: "Master",
  DIRETOR_CONTEUDO: "Diretor de Conteúdo",
  EXECUTOR: "Executor",
};

interface Usuario {
  id: string;
  nome: string;
  login: string;
  nivel: Nivel;
  responsavel: string;
  createdAt: string;
}

const empty = { nome: "", login: "", senha: "", nivel: "MASTER" as Nivel, responsavel: "" };

export function CadastrarLoginClient() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const { toasts, toast } = useToasts();

  const isExecutor = form.nivel === "EXECUTOR";

  function carregar() {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then(setUsuarios)
      .catch(() => toast("Erro ao carregar logins", "error"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, []);

  function startEdit(u: Usuario) {
    setEditingId(u.id);
    setForm({ nome: u.nome, login: u.login, senha: "", nivel: u.nivel, responsavel: u.responsavel });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nome.trim() || !form.login.trim() || (!editingId && !form.senha)) {
      setError(editingId ? "Preencha nome e login." : "Preencha nome, login e senha.");
      return;
    }
    if (isExecutor && !form.responsavel) {
      setError("Selecione o responsável.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/usuarios/${editingId}` : "/api/usuarios", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar login.");
        return;
      }
      toast(editingId ? `Login "${data.login}" atualizado!` : `Login "${data.login}" criado!`, "success");
      setEditingId(null);
      setForm(empty);
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
        if (editingId === deleteTarget.id) cancelEdit();
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
        {editingId && (
          <div className="card-badge badge-cancelado" style={{ marginBottom: 14 }}>
            <i className="fas fa-pen" style={{ marginRight: 6 }} />
            Editando login existente
          </div>
        )}

        <div className="form-group">
          <label>
            Nome <span>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Nome que aparece ao lado da foto ao logar"
            autoComplete="off"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
          />
        </div>

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
              Senha {!editingId && <span>*</span>}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={editingId ? "Deixe em branco para manter a atual" : ""}
              autoComplete="off"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              required={!editingId}
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
          {isExecutor && (
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

        <div className="form-footer" style={{ justifyContent: "flex-start" }}>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            <i className={`fas ${editingId ? "fa-save" : "fa-user-plus"}`} />{" "}
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar login"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              Cancelar edição
            </button>
          )}
        </div>
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
                <div className="cadastrar-login-row-login">
                  {u.nome || u.login} <span className="cadastrar-login-row-login-sub">@{u.login}</span>
                </div>
                <div className="cadastrar-login-row-meta">
                  {NIVEL_LABEL[u.nivel]}
                  {u.responsavel ? ` · ${u.responsavel}` : ""}
                </div>
              </div>
              <div className="cadastrar-login-row-actions">
                <button className="card-action-btn" onClick={() => startEdit(u)} title="Editar login">
                  <i className="fas fa-pen" />
                </button>
                <button className="card-action-btn danger" onClick={() => setDeleteTarget(u)} title="Apagar login">
                  <i className="fas fa-trash" />
                </button>
              </div>
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
