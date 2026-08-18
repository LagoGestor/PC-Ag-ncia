"use client";

import { Tarefa } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
}

export function DirecionarView({ list, onEdit, onToggleArchive, onDelete }: Props) {
  if (!list.length) {
    return (
      <div className="empty-state">
        <i className="fas fa-arrow-right-arrow-left" />
        <h3>Nada para direcionar</h3>
        <p>Tarefas com responsável &quot;Armazenar&quot; aparecerão aqui até serem direcionadas ao time.</p>
      </div>
    );
  }
  return (
    <div className="direcionar-row">
      {list.map((t) => (
        <TaskCard key={t.id} t={t} onEdit={onEdit} onToggleArchive={onToggleArchive} onDelete={onDelete} />
      ))}
    </div>
  );
}
