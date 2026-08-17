"use client";

import { useState } from "react";
import { ICONES_AREA, STATUS_BADGE_CLASS, STATUS_COLORS, Tarefa } from "@/types";
import { Avatar } from "./Avatar";

function fmtDate(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

function isOverdue(d: string) {
  if (!d) return false;
  const today = new Date();
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");
  return d < todayStr;
}

interface Props {
  t: Tarefa;
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
  onDragStart?: (id: string) => void;
}

export function TaskCard({ t, onEdit, onToggleArchive, onDelete, onDragStart }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[t.status] || "#666";
  const badgeClass = STATUS_BADGE_CLASS[t.status] || "";
  const icon = ICONES_AREA[t.area] || "";
  const overdue = isOverdue(t.entrega) && t.status !== "Concluído" && t.status !== "Cancelado";

  return (
    <div
      className="task-card"
      style={{ ["--status-color" as string]: color }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text", t.id);
        onDragStart?.(t.id);
      }}
    >
      <div className="card-top">
        {icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="card-area-icon"
            src={icon}
            alt={t.area}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="card-title-wrap">
          <div className="card-title">{t.tarefa}</div>
          <div className="card-sub">
            {t.area}
            {t.tipo ? ` · ${t.tipo}` : ""} ·{" "}
            <span className="resp-inline">
              <Avatar name={t.responsavel} size={14} /> {t.responsavel}
            </span>
          </div>
        </div>
        <div className="card-actions">
          <button className="card-action-btn" onClick={() => onEdit(t)} title="Editar">
            <i className="fas fa-pen" />
          </button>
          <button
            className="card-action-btn"
            onClick={() => onToggleArchive(t)}
            title={t.arquivada ? "Desarquivar" : "Arquivar"}
          >
            <i className={`fas ${t.arquivada ? "fa-box-open" : "fa-box-archive"}`} />
          </button>
          <button className="card-action-btn danger" onClick={() => onDelete(t)} title="Apagar">
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>

      <div className={`card-badge ${badgeClass}`}>{t.status}</div>

      <div
        className={`card-desc${expanded ? " expanded" : ""}`}
        onClick={() => setExpanded((v) => !v)}
        title="Clique para expandir"
      >
        {t.descricao || <i style={{ opacity: 0.4 }}>Sem descrição</i>}
      </div>

      <div className="card-dates">
        <div className="date-item">
          <span className="date-label">Solicit.</span>
          <span className="date-val">{fmtDate(t.solicitacao)}</span>
        </div>
        {t.feedback && (
          <div className="date-item">
            <span className="date-label">Feedback</span>
            <span className="date-val">{fmtDate(t.feedback)}</span>
          </div>
        )}
        <div className="date-item">
          <span className="date-label">Entrega</span>
          <span className={`date-val ${overdue ? "overdue-date" : ""}`}>{fmtDate(t.entrega)}</span>
        </div>
      </div>
    </div>
  );
}

export { fmtDate, isOverdue };
