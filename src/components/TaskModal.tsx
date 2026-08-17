"use client";

import { FormEvent, useEffect, useState } from "react";
import { AREAS, RESPONSAVEIS, STATUSES, Status, Tarefa, TIPOS } from "@/types";

type FormState = {
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  status: Status;
};

const empty = (): FormState => ({
  tarefa: "",
  area: "",
  tipo: "",
  responsavel: "",
  descricao: "",
  solicitacao: new Date().toISOString().split("T")[0],
  feedback: "",
  entrega: "",
  status: "Ativa",
});

interface Props {
  open: boolean;
  editing: Tarefa | null;
  onClose: () => void;
  onSave: (data: FormState, id?: string) => void;
  onGenerate: (t: Tarefa) => void;
}

export function TaskModal({ open, editing, onClose, onSave, onGenerate }: Props) {
  const [form, setForm] = useState<FormState>(empty());
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        tarefa: editing.tarefa,
        area: editing.area,
        tipo: editing.tipo,
        responsavel: editing.responsavel,
        descricao: editing.descricao,
        solicitacao: editing.solicitacao,
        feedback: editing.feedback,
        entrega: editing.entrega,
        status: editing.status,
      });
    } else {
      setForm(empty());
    }
    setError("");
    setAdded(false);
  }, [open, editing]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tarefa.trim() || !form.area || !form.responsavel) {
      setError("Preencha os campos obrigatórios");
      return;
    }
    onSave(form, editing?.id);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{editing ? "Editar Tarefa" : "Nova Tarefa"}</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {editing?.fixa && (
            <div className="card-badge badge-cancelado" style={{ marginBottom: 14 }}>
              <i className="fas fa-repeat" style={{ marginRight: 6 }} />
              Atividade fixa da semana · {editing.diaSemana}
            </div>
          )}
          <div className="form-group">
            <label>
              Título da tarefa <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Descreva a tarefa brevemente"
              value={form.tarefa}
              onChange={(e) => set("tarefa", e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Área <span>*</span>
              </label>
              <select
                className="form-control"
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Responsável <span>*</span>
              </label>
              <select
                className="form-control"
                value={form.responsavel}
                onChange={(e) => set("responsavel", e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {RESPONSAVEIS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select className="form-control" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                <option value="">Selecione...</option>
                {TIPOS.map((tp) => (
                  <option key={tp}>{tp}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Detalhes, contexto, observações..."
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Solicitação <span>*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={form.solicitacao}
                onChange={(e) => set("solicitacao", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Feedback</label>
              <input
                type="date"
                className="form-control"
                value={form.feedback}
                onChange={(e) => set("feedback", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>
                Entrega <span>*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={form.entrega}
                onChange={(e) => set("entrega", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Status <span>*</span>
              </label>
              <select className="form-control" value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {editing?.fixa && (
              <div className="form-group">
                <label>Adicionar à Lista</label>
                <div className="form-toggle">
                  <button
                    type="button"
                    className={added ? "active" : ""}
                    disabled={added}
                    onClick={() => {
                      onGenerate(editing);
                      setAdded(true);
                    }}
                  >
                    {added ? <><i className="fas fa-check" /> Sim</> : "Sim"}
                  </button>
                  <button type="button" className={!added ? "active" : ""} disabled={added}>
                    Não
                  </button>
                </div>
              </div>
            )}
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
