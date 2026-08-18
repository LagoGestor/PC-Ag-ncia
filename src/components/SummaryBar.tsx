"use client";

import { STATUSES, STATUS_COLORS, Tarefa } from "@/types";

interface Props {
  tarefas: Tarefa[];
  statusFilter: string | null;
  onToggle: (s: string) => void;
}

export function SummaryBar({ tarefas, statusFilter, onToggle }: Props) {
  const visible = tarefas.filter((t) => !t.arquivada);
  const counts: Record<string, number> = { Ativa: 0, Pendente: 0, Atrasada: 0, "Concluído": 0, Cancelado: 0 };
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
        <i className="fas fa-layer-group" /> Total: <b>{visible.length}</b>
      </div>
    </div>
  );
}
