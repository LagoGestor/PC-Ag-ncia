"use client";

interface Props {
  open: boolean;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ open, text, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box confirm-modal">
        <div className="confirm-icon">
          <i className="fas fa-trash" />
        </div>
        <h3>Apagar tarefa?</h3>
        <p>{text}</p>
        <div className="form-footer" style={{ justifyContent: "center" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fas fa-trash" /> Apagar
          </button>
        </div>
      </div>
    </div>
  );
}
