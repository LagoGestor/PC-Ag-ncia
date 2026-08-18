"use client";

import { RESPONSAVEL_ARMAZENAR, STATUSES, STATUS_COLORS, Tarefa } from "@/types";

interface Props {
  tarefas: Tarefa[];
  statusFilter: string | null;
  onToggle: (s: string) => void;
}

export function SummaryBar({ tarefas, statusFilter, onToggle }: Props) {
  const visible = tarefas.filter((t) => !t.arquivada && t.responsavel !== RESPONSAVEL_ARMAZENAR);
  const counts: Record<string, number> = { Ativa: 0, Pendente: 0, Atrasada: 0, "Concluído": 0, Cancelado: 0, Inativa: 0 };
  visible.forEach((t) => {
    if (counts[t.status] !== undefined) counts[t.status]++;
  });

  return (
    <div id="summary-bar">
      {STATUSES.map((s) => (
        <div
          key={s}
          className={`sum-pill${statusFilter === s ? " active" : ""}`}
          onClick={() => onToggle(s)}
          title={`${s}: ${counts[s]}`}
        >
          <div className="dot" style={{ background: STATUS_COLORS[s] }} />
          <span className="label">{s}</span>
          <span className="count">{counts[s]}</span>
        </div>
      ))}
      <div className="sum-total">
        <i className="fas fa-layer-group" />
        <span className="sum-total-label">Total:</span> <b>{visible.length}</b>
      </div>
    </div>
  );
}
