"use client";

import { useState } from "react";
import { STATUS_COLORS, Status, Tarefa } from "@/types";
import { TaskCard } from "./TaskCard";

const COLS: Status[] = ["Pendente", "Ativa", "Atrasada", "Concluído"];

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
  onDrop: (id: string, status: Status) => void;
}

export function KanbanView({ list, onEdit, onToggleArchive, onDelete, onDrop }: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="kanban-board">
      {COLS.map((s) => {
        const cards = list.filter((t) => t.status === s);
        return (
          <div
            key={s}
            className={`kanban-col${dragOver === s ? " drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(s);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text");
              if (id) onDrop(id, s);
            }}
          >
            <div className="kanban-header">
              <div className="col-dot" style={{ background: STATUS_COLORS[s] }} />
              <span className="col-name">{s}</span>
              <span className="col-count">{cards.length}</span>
            </div>
            <div className="kanban-cards">
              {cards.length ? (
                cards.map((t) => (
                  <TaskCard key={t.id} t={t} onEdit={onEdit} onToggleArchive={onToggleArchive} onDelete={onDelete} />
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--fg-muted)", fontSize: 11 }}>
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
