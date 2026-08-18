"use client";

import { useMemo, useState } from "react";
import { STATUS_BADGE_CLASS, STATUS_COLORS, Tarefa } from "@/types";
import { Avatar } from "./Avatar";
import { useIsMobile } from "@/hooks/useIsMobile";

type Mode = "mes" | "semana";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return toKey(a) === toKey(b);
}

function getMonthGrid(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const start = new Date(year, month, 1 - startDay);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  list: Tarefa[];
  onOpenDetail: (t: Tarefa) => void;
}

export function AgendaView({ list, onOpenDetail }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("mes");
  const [anchor, setAnchor] = useState(() => new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    for (const t of list) {
      if (!t.entrega) continue;
      const arr = map.get(t.entrega) ?? [];
      arr.push(t);
      map.set(t.entrega, arr);
    }
    return map;
  }, [list]);

  const today = new Date();

  function goPrev() {
    setAnchor((d) => (mode === "mes" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)));
  }
  function goNext() {
    setAnchor((d) => (mode === "mes" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)));
  }
  function goToday() {
    setAnchor(new Date());
  }

  const label =
    mode === "mes"
      ? capitalize(anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))
      : (() => {
          const days = getWeekDays(anchor);
          const first = days[0];
          const last = days[6];
          const sameMonth = first.getMonth() === last.getMonth();
          const firstStr = first.toLocaleDateString("pt-BR", { day: "2-digit", month: sameMonth ? undefined : "short" });
          const lastStr = last.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
          return `${firstStr} – ${lastStr}`;
        })();

  return (
    <div>
      <div className="agenda-toolbar">
        <div className="agenda-toggle">
          <button className={mode === "mes" ? "active" : ""} onClick={() => setMode("mes")}>
            Visualização por mês
          </button>
          <button className={mode === "semana" ? "active" : ""} onClick={() => setMode("semana")}>
            Visualização por semana
          </button>
        </div>
        <div className="agenda-nav">
          <button onClick={goPrev} title="Anterior">
            <i className="fas fa-chevron-left" />
          </button>
          <span className="agenda-label">{label}</span>
          <button onClick={goNext} title="Próximo">
            <i className="fas fa-chevron-right" />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>
            Hoje
          </button>
        </div>
      </div>

      {mode === "mes" ? (
        <div className="grid-scroll-wrap">
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="calendar-weekday">
              {w}
            </div>
          ))}
          {getMonthGrid(anchor).map((d) => {
            const key = toKey(d);
            const tasks = byDay.get(key) ?? [];
            const outside = d.getMonth() !== anchor.getMonth();
            const isToday = sameDay(d, today);
            const isExpanded = isMobile && expandedDay === key;

            if (isMobile) {
              return (
                <div
                  key={key}
                  className={`calendar-cell${outside ? " outside" : ""}${isToday ? " today" : ""}${isExpanded ? " expanded" : ""}`}
                  onClick={() => tasks.length > 0 && setExpandedDay(isExpanded ? null : key)}
                >
                  <div className="calendar-daynum">{d.getDate()}</div>
                  {isExpanded ? (
                    <div className="calendar-cell-detail">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="calendar-detail-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(t);
                          }}
                        >
                          <Avatar name={t.responsavel} size={18} ringColor={STATUS_COLORS[t.status]} />
                          <span>{t.tarefa}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="calendar-chip-row">
                      {tasks.slice(0, 3).map((t) => (
                        <span key={t.id} className="calendar-tipo-chip" style={{ background: STATUS_COLORS[t.status] || "var(--gray)" }}>
                          {t.tipo || "•"}
                        </span>
                      ))}
                      {tasks.length > 3 && <span className="calendar-chip-more">+{tasks.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={key} className={`calendar-cell${outside ? " outside" : ""}${isToday ? " today" : ""}`}>
                <div className="calendar-daynum">{d.getDate()}</div>
                {tasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="calendar-task"
                    style={{ borderLeftColor: STATUS_COLORS[t.status] || "var(--gray)" }}
                    onClick={() => onOpenDetail(t)}
                    title={t.tarefa}
                  >
                    {t.tarefa}
                  </div>
                ))}
                {tasks.length > 4 && <div className="calendar-more">+{tasks.length - 4} mais</div>}
              </div>
            );
          })}
        </div>
        </div>
      ) : (
        <div className="grid-scroll-wrap">
        <div className="week-grid">
          {getWeekDays(anchor).map((d) => {
            const key = toKey(d);
            const tasks = byDay.get(key) ?? [];
            const isToday = sameDay(d, today);
            return (
              <div key={key} className={`week-day-col${isToday ? " today" : ""}`}>
                <div className="week-day-header">
                  <div className="wd-name">{WEEKDAYS[d.getDay()]}</div>
                  <div className="wd-num">{d.getDate()}</div>
                </div>
                <div className="week-day-body">
                  {tasks.map((t) => (
                    <div key={t.id} className="week-task" onClick={() => onOpenDetail(t)}>
                      <div className="week-task-title">{t.tarefa}</div>
                      <div className="week-task-meta">
                        <span className="week-task-resp resp-inline">
                          <Avatar name={t.responsavel} size={14} ringColor={STATUS_COLORS[t.status]} /> {t.responsavel}
                        </span>
                        <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}
