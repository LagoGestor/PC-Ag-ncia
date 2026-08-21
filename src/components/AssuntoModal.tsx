"use client";

import { FormEvent, useEffect, useState } from "react";

interface FormState {
  tema: string;
  descricao: string;
  encaminhamento: string;
  responsavel: string;
}

const empty = (): FormState => ({ tema: "", descricao: "", encaminhamento: "", responsavel: "" });

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
}

export function AssuntoModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(empty());
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(empty());
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tema.trim()) {
      setError("Preencha o tema do assunto");
      return;
    }
    onSave(form);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">Novo Assunto</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              Tema <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Assunto tratado"
              value={form.tema}
              onChange={(e) => set("tema", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Detalhes do que foi discutido"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Encaminhamento</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="O que ficou decidido / próximos passos"
              value={form.encaminhamento}
              onChange={(e) => set("encaminhamento", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Responsável</label>
            <input
              type="text"
              className="form-control"
              placeholder="Quem vai encaminhar"
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
            />
          </div>

          {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-accent">
              <i className="fas fa-save" /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
