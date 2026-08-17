"use client";

import { Tarefa } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
}

export function ArquivadasView({ list, onEdit, onToggleArchive, onDelete }: Props) {
  if (!list.length) {
    return (
      <div className="empty-state">
        <i className="fas fa-box-archive" />
        <h3>Arquivo vazio</h3>
        <p>Tarefas arquivadas aparecerão aqui.</p>
      </div>
    );
  }
  return (
    <div className="archive-grid">
      {list.map((t) => (
        <TaskCard key={t.id} t={t} onEdit={onEdit} onToggleArchive={onToggleArchive} onDelete={onDelete} />
      ))}
    </div>
  );
}
