"use client";

import { useState } from "react";
import { STATUS_BADGE_CLASS, STATUSES } from "@/types";
import { Avatar } from "./Avatar";

function fmtDate(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

export interface MobileTarefa {
  id: string;
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  link: string;
  linksExtras: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  horarioPublicacao: string;
  status: string;
}

export function MobileTaskCard({
  t,
  showResponsavel,
  onStatusChange,
  onEdit,
}: {
  t: MobileTarefa;
  showResponsavel?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const overdue = t.status === "Atrasada";

  return (
    <div className="mob-card" onClick={() => setOpen((v) => !v)}>
      <div className="mob-card-top">
        <span className="mob-tipo">{t.tipo || t.area}</span>
        {onStatusChange ? (
          <select
            className={`card-badge card-badge-select ${STATUS_BADGE_CLASS[t.status] || ""}`}
            value={t.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(t.id, e.target.value);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
        )}
      </div>

      <div className="mob-title">{t.tarefa}</div>

      <div className="mob-meta">
        <span>{t.area}</span>
        {showResponsavel && (
          <span className="resp-inline">
            · <Avatar name={t.responsavel} size={16} /> {t.responsavel}
          </span>
        )}
      </div>

      <div className="mob-dates">
        <span className={overdue ? "overdue-date" : ""}>
          <i className="fas fa-flag-checkered" /> Entrega {fmtDate(t.entrega)}
        </span>
        {t.solicitacao && <span className="mob-date-sub">Solicit. {fmtDate(t.solicitacao)}</span>}
      </div>

      {open && (
        <>
          <div className="mob-desc">{t.descricao || "Sem descrição."}</div>
          {t.horarioPublicacao && (
            <div className="desc-link-row">
              <span className="desc-link-label">Postar às:</span>
              <span>{t.horarioPublicacao}</span>
            </div>
          )}
          <div className="desc-link-row">
            <span className="desc-link-label">Possui Link:</span>
            {t.link ? (
              <>
                <a
                  className="desc-link-btn"
                  href={t.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Sim. Clique aqui para abrir
                </a>
                {t.linksExtras
                  .split("\n")
                  .filter(Boolean)
                  .map((url, i) => (
                    <a
                      key={i}
                      className="desc-link-btn"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Link {i + 2}
                    </a>
                  ))}
              </>
            ) : (
              <span>Não.</span>
            )}
          </div>
          {onEdit && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <i className="fas fa-pen" /> Editar
            </button>
          )}
        </>
      )}
    </div>
  );
}
