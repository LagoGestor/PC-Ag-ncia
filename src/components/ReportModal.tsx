"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerate: (inicio: string, fim: string) => void;
}

export function ReportModal({ open, onClose, onGenerate }: Props) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title">Gerar Relatório</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <p style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>
          Selecione o período de entrega das atividades que devem entrar no relatório em PDF.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>
              De <span>*</span>
            </label>
            <input type="date" className="form-control" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>
              Até <span>*</span>
            </label>
            <input type="date" className="form-control" value={fim} onChange={(e) => setFim(e.target.value)} required />
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-accent"
            disabled={!inicio || !fim}
            onClick={() => onGenerate(inicio, fim)}
          >
            <i className="fas fa-file-pdf" /> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
