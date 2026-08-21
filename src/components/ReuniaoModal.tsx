"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modalidade } from "@/types";

interface FormState {
  data: string;
  participantes: string;
  modalidade: Modalidade;
}

const empty = (): FormState => ({
  data: new Date().toISOString().split("T")[0],
  participantes: "",
  modalidade: "Presencial",
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
}

export function ReuniaoModal({ open, onClose, onSave }: Props) {
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
    if (!form.data) {
      setError("Preencha a data da reunião");
      return;
    }
    onSave(form);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Nova Reunião</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              Data <span>*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={form.data}
              onChange={(e) => set("data", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Participantes</label>
            <input
              type="text"
              className="form-control"
              placeholder="Quem participou da reunião"
              value={form.participantes}
              onChange={(e) => set("participantes", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Modalidade</label>
            <div className="form-toggle">
              <button type="button" className={form.modalidade === "Online" ? "active" : ""} onClick={() => set("modalidade", "Online")}>
                Online
              </button>
              <button
                type="button"
                className={form.modalidade === "Presencial" ? "active" : ""}
                onClick={() => set("modalidade", "Presencial")}
              >
                Presencial
              </button>
            </div>
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
