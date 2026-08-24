"use client";

import { useMemo, useState } from "react";
import { STATUS_BADGE_CLASS, STATUS_COLORS, Tarefa, TIPOS_CRONOGRAMA_POSTAGENS, TIPOS_FORA_DAS_REDES } from "@/types";
import { Avatar } from "./Avatar";
import { useIsMobile } from "@/hooks/useIsMobile";

type Mode = "mes" | "semana";
type TipoFiltro = "todas" | "cronograma" | "fora";

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
  const diffToMonday = (day + 6) % 7;
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - diffToMonday);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const TIPO_FILTRO_LABEL: Record<TipoFiltro, string> = {
  todas: "Todas as Entregas",
  cronograma: "Cronograma de Postagens",
  fora: "Tarefas fora das Redes",
};

interface Props {
  list: Tarefa[];
  onOpenDetail: (t: Tarefa) => void;
}

export function AgendaView({ list, onOpenDetail }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("mes");
  const [anchor, setAnchor] = useState(() => new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todas");

  const listFiltrada = useMemo(() => {
    if (tipoFiltro === "todas") return list;
    const conjunto = tipoFiltro === "cronograma" ? TIPOS_CRONOGRAMA_POSTAGENS : TIPOS_FORA_DAS_REDES;
    return list.filter((t) => conjunto.includes(t.tipo));
  }, [list, tipoFiltro]);

  const byDay = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    for (const t of listFiltrada) {
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
  }, [listFiltrada]);

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

  async function handleGerarRelatorio() {
    const { default: jsPDF } = await import("jspdf");
    const pageW = 280;
    const pageH = 157.5; // 16:9
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageW, pageH] });

    const marginX = 8;
    const gridTop = 20;
    const gridBottom = pageH - 6;
    const gridH = gridBottom - gridTop;
    const gridW = pageW - marginX * 2;
    const cols = 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("Agenda", marginX, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`${label}  ·  Filtro: ${TIPO_FILTRO_LABEL[tipoFiltro]}`, marginX, 16);

    if (mode === "mes") {
      const rows = 6;
      const cellW = gridW / cols;
      const cellH = gridH / rows;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      WEEKDAYS.forEach((w, i) => {
        doc.text(w, marginX + i * cellW + cellW / 2, gridTop - 2, { align: "center" });
      });

      getMonthGrid(anchor).forEach((d, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = marginX + col * cellW;
        const y = gridTop + row * cellH;
        const outside = d.getMonth() !== anchor.getMonth();

        if (outside) {
          doc.setFillColor(246, 246, 246);
          doc.rect(x, y, cellW, cellH, "F");
        }
        doc.setDrawColor(215, 215, 215);
        doc.rect(x, y, cellW, cellH);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        const dayShade = outside ? 175 : 35;
        doc.setTextColor(dayShade, dayShade, dayShade);
        doc.text(String(d.getDate()), x + 1.5, y + 4.5);

        const dayTasks = byDay.get(toKey(d)) ?? [];
        const maxLines = Math.max(Math.floor((cellH - 7) / 3.3), 0);
        let ty = y + 8.5;
        doc.setFont("helvetica", "normal");
        dayTasks.slice(0, maxLines).forEach((t) => {
          const [r, g, b] = hexToRgb(STATUS_COLORS[t.status] || "#6b7280");
          doc.setFillColor(r, g, b);
          doc.rect(x + 1.3, ty - 1.9, 1.4, 1.4, "F");
          doc.setFontSize(5.8);
          doc.setTextColor(60, 60, 60);
          const txt = `${t.horarioPublicacao ? t.horarioPublicacao + " " : ""}${t.tarefa}`;
          doc.text(doc.splitTextToSize(txt, cellW - 4)[0] || "", x + 3.3, ty);
          ty += 3.3;
        });
        if (dayTasks.length > maxLines) {
          doc.setFontSize(5.5);
          doc.setTextColor(150, 150, 150);
          doc.text(`+${dayTasks.length - maxLines} mais`, x + 3.3, ty);
        }
      });
    } else {
      const cellW = gridW / cols;

      getWeekDays(anchor).forEach((d, i) => {
        const x = marginX + i * cellW;

        doc.setDrawColor(215, 215, 215);
        doc.rect(x, gridTop, cellW, gridH);
        doc.setFillColor(244, 245, 247);
        doc.rect(x, gridTop, cellW, 9, "F");
        doc.setDrawColor(215, 215, 215);
        doc.rect(x, gridTop, cellW, 9);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(40, 40, 40);
        doc.text(`${WEEKDAYS[d.getDay()]}  ${d.getDate()}`, x + cellW / 2, gridTop + 6, { align: "center" });

        const dayTasks = byDay.get(toKey(d)) ?? [];
        let ty = gridTop + 13;
        dayTasks.forEach((t) => {
          if (ty > gridBottom - 3) return;
          const [r, g, b] = hexToRgb(STATUS_COLORS[t.status] || "#6b7280");
          doc.setFillColor(r, g, b);
          doc.rect(x + 1.6, ty - 2.1, 1.6, 1.6, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.3);
          doc.setTextColor(50, 50, 50);
          const linha1 = `${t.horarioPublicacao ? t.horarioPublicacao + " " : ""}${t.tarefa}`;
          doc.text(doc.splitTextToSize(linha1, cellW - 5)[0] || "", x + 4, ty);
          ty += 3;

          doc.setFontSize(5.4);
          doc.setTextColor(130, 130, 130);
          const linha2 = `${t.responsavel} · ${t.status}`;
          doc.text(doc.splitTextToSize(linha2, cellW - 5)[0] || "", x + 4, ty);
          ty += 4.2;
        });
      });
    }

    doc.save(`agenda_${mode}_${toKey(anchor)}.pdf`);
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
          <button className="btn btn-ghost btn-sm" onClick={handleGerarRelatorio}>
            <i className="fas fa-file-pdf" /> Gerar Relatório
          </button>
        </div>
      </div>

      <div className="agenda-toggle agenda-tipo-filter">
        <button className={tipoFiltro === "todas" ? "active" : ""} onClick={() => setTipoFiltro("todas")}>
          Todas as Entregas
        </button>
        <button className={tipoFiltro === "cronograma" ? "active" : ""} onClick={() => setTipoFiltro("cronograma")}>
          Cronograma de Postagens
        </button>
        <button className={tipoFiltro === "fora" ? "active" : ""} onClick={() => setTipoFiltro("fora")}>
          Tarefas fora das Redes
        </button>
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
                          <Avatar name={t.responsavel} size={18} />
                          <span>
                            {t.horarioPublicacao && <b>{t.horarioPublicacao} </b>}
                            {t.tarefa}
                          </span>
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
                    {t.horarioPublicacao && <b>{t.horarioPublicacao} </b>}
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
                      <div className="week-task-title">
                        {t.horarioPublicacao && <b>{t.horarioPublicacao} </b>}
                        {t.tarefa}
                      </div>
                      <div className="week-task-meta">
                        <span className="week-task-resp resp-inline">
                          <Avatar name={t.responsavel} size={14} /> {t.responsavel}
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
