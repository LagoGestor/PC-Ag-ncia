"use client";

import { useState } from "react";
import { STATUS_BADGE_CLASS } from "@/types";
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

export interface MobileTarefa {
  id: string;
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  status: string;
}

export function MobileTaskCard({ t, showResponsavel }: { t: MobileTarefa; showResponsavel?: boolean }) {
  const [open, setOpen] = useState(false);
  const overdue = isOverdue(t.entrega) && t.status !== "Concluído" && t.status !== "Cancelado";

  return (
    <div className="mob-card" onClick={() => setOpen((v) => !v)}>
      <div className="mob-card-top">
        <span className="mob-tipo">{t.tipo || t.area}</span>
        <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
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

      {open && <div className="mob-desc">{t.descricao || "Sem descrição."}</div>}
    </div>
  );
}
