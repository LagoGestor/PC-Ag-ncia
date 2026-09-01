"use client";

import { useEffect, useMemo, useState } from "react";
import { RESPONSAVEL_ARMAZENAR, STATUS_BADGE_CLASS, Tarefa } from "@/types";
import { api } from "@/lib/api";
import { TaskModal } from "./TaskModal";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - diffToMonday);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

interface Props {
  editable?: boolean;
}

export function CronogramaSemanalView({ editable = false }: Props) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null);
  const [editing, setEditing] = useState<Tarefa | null>(null);

  useEffect(() => {
    api
      .list()
      .then((all) => setTarefas(all.filter((t) => !t.arquivada && !t.fixa && t.responsavel !== RESPONSAVEL_ARMAZENAR)))
      .catch(() => setTarefas([]));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    for (const t of tarefas ?? []) {
      if (!t.entrega) continue;
      const arr = map.get(t.entrega) ?? [];
      arr.push(t);
      map.set(t.entrega, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (!a.horarioPublicacao && !b.horarioPublicacao) return 0;
        if (!a.horarioPublicacao) return 1;
        if (!b.horarioPublicacao) return -1;
        return a.horarioPublicacao.localeCompare(b.horarioPublicacao);
      });
    }
    return map;
  }, [tarefas]);

  const days = getWeekDays(anchor);
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const label = `${first.toLocaleDateString("pt-BR", { day: "2-digit", month: sameMonth ? undefined : "short" })} – ${last.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  function goPrev() {
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  }
  function goNext() {
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  }
  function goToday() {
    setAnchor(new Date());
  }

  async function handleSave(data: Omit<Tarefa, "id" | "arquivada" | "fixa" | "diaSemana">, id?: string) {
    if (!id) return;
    const updated = await api.update(id, data);
    setTarefas((prev) => (prev ? prev.map((t) => (t.id === id ? updated : t)) : prev));
    setEditing(null);
  }

  return (
    <div className="cronograma-semanal">
      <div className="cronograma-nav">
        <button onClick={goPrev} title="Semana anterior">
          <i className="fas fa-chevron-left" />
        </button>
        <span className="agenda-label">{label}</span>
        <button onClick={goNext} title="Próxima semana">
          <i className="fas fa-chevron-right" />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={goToday}>
          Hoje
        </button>
      </div>

      {tarefas === null ? (
        <p className="mobile-empty">Carregando...</p>
      ) : (
        days.map((d) => {
          const key = toKey(d);
          const tasks = byDay.get(key) ?? [];
          return (
            <div key={key} className="cronograma-day">
              <div className="cronograma-day-header">
                {WEEKDAYS[d.getDay()]} {d.getDate()}
              </div>
              {tasks.length === 0 ? (
                <div className="fixas-empty">Sem atividades</div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`cronograma-task-row${editable ? " cronograma-task-row-editable" : ""}`}
                    onClick={editable ? () => setEditing(t) : undefined}
                  >
                    <div className="cronograma-task-top">
                      <span className="cronograma-task-tipo">{t.tipo || "—"}</span>
                      <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
                    </div>
                    <div className="cronograma-task-bottom">
                      <span className="cronograma-task-time">{t.horarioPublicacao || "—"}</span>
                      <span className="cronograma-task-title">{t.tarefa}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })
      )}

      {editable && (
        <TaskModal
          open={!!editing}
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onGenerate={() => {}}
        />
      )}
    </div>
  );
}
