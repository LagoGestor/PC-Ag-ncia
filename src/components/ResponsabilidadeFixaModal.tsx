"use client";

import { FormEvent, useEffect, useState } from "react";
import { RESPONSAVEIS_VISIVEIS, ResponsabilidadeFixa } from "@/types";

type FormState = { responsavel: string; atividade: string; descricao: string };

const empty: FormState = { responsavel: "", atividade: "", descricao: "" };

interface Props {
  open: boolean;
  editing: ResponsabilidadeFixa | null;
  onClose: () => void;
  onSave: (data: FormState, id?: string) => void;
  onDelete?: (r: ResponsabilidadeFixa) => void;
}

export function ResponsabilidadeFixaModal({ open, editing, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(editing ? { responsavel: editing.responsavel, atividade: editing.atividade, descricao: editing.descricao } : empty);
    setError("");
  }, [open, editing]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.responsavel || !form.atividade.trim()) {
      setError("Preencha o responsável e a atividade fixa.");
      return;
    }
    onSave({ responsavel: form.responsavel, atividade: form.atividade.trim(), descricao: form.descricao }, editing?.id);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{editing ? "Editar Responsabilidade Fixa" : "Nova Responsabilidade Fixa"}</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              Responsável <span>*</span>
            </label>
            <select className="form-control" value={form.responsavel} onChange={(e) => set("responsavel", e.target.value)} required>
              <option value="" disabled>
                Selecione...
              </option>
              {RESPONSAVEIS_VISIVEIS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Atividade Fixa <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex.: Gerenciar o Instagram da Agência"
              value={form.atividade}
              onChange={(e) => set("atividade", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Detalhes dessa responsabilidade..."
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div className="form-footer">
            {editing && onDelete && (
              <button
                type="button"
                className="btn btn-ghost dropdown-item-danger"
                style={{ marginRight: "auto" }}
                onClick={() => onDelete(editing)}
              >
                <i className="fas fa-trash" /> Apagar
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-accent">
              <i className="fas fa-check" /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
