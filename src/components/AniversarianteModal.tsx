"use client";

import { FormEvent, useEffect, useState } from "react";
import { Aniversariante, MESES } from "@/types";

type FormState = {
  nome: string;
  ministerio: string;
  cargo: string;
  instagram: string;
  dia: string;
  mes: string;
};

const empty: FormState = { nome: "", ministerio: "", cargo: "", instagram: "", dia: "", mes: "" };

interface Props {
  open: boolean;
  editing: Aniversariante | null;
  onClose: () => void;
  onSave: (data: { nome: string; ministerio: string; cargo: string; instagram: string; dia: number | null; mes: number | null }, id?: string) => void;
}

export function AniversarianteModal({ open, editing, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        nome: editing.nome,
        ministerio: editing.ministerio,
        cargo: editing.cargo,
        instagram: editing.instagram,
        dia: editing.dia ? String(editing.dia) : "",
        mes: editing.mes ? String(editing.mes) : "",
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [open, editing]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError("Preencha o nome.");
      return;
    }
    onSave(
      {
        nome: form.nome.trim(),
        ministerio: form.ministerio.trim(),
        cargo: form.cargo.trim(),
        instagram: form.instagram.trim(),
        dia: form.dia ? Number(form.dia) : null,
        mes: form.mes ? Number(form.mes) : null,
      },
      editing?.id
    );
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{editing ? "Editar Aniversariante" : "Novo Aniversariante"}</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              Nome <span>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dia</label>
              <select className="form-control" value={form.dia} onChange={(e) => set("dia", e.target.value)}>
                <option value="">—</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mês</label>
              <select className="form-control" value={form.mes} onChange={(e) => set("mes", e.target.value)}>
                <option value="">—</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Ministério(s)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex.: Global, Hero..."
              value={form.ministerio}
              onChange={(e) => set("ministerio", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cargo eclesiástico</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex.: Pastor, Diácono..."
                value={form.cargo}
                onChange={(e) => set("cargo", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                className="form-control"
                placeholder="@usuario"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value.replace(/^@/, ""))}
              />
            </div>
          </div>

          {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div className="form-footer">
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
