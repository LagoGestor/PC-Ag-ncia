"use client";

import { Tarefa } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
}

export function DashboardView({ list, onEdit, onToggleArchive, onDelete }: Props) {
  if (!list.length) {
    return (
      <div className="empty-state">
        <i className="fas fa-check-double" />
        <h3>Nenhuma tarefa</h3>
        <p>Crie sua primeira tarefa clicando em &quot;Nova Tarefa&quot;</p>
      </div>
    );
  }
  return (
    <div className="card-grid">
      {list.map((t) => (
        <TaskCard key={t.id} t={t} onEdit={onEdit} onToggleArchive={onToggleArchive} onDelete={onDelete} />
      ))}
    </div>
  );
}
