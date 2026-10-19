"use client";

import { useLayoutEffect, useState } from "react";
import { STATUS_BADGE_CLASS, STATUS_COLORS, Tarefa } from "@/types";
import { Avatar } from "./Avatar";

const WEEKDAYS_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  days: Date[];
  byDay: Map<string, Tarefa[]>;
  label: string;
  toKey: (d: Date) => string;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenDetail: (t: Tarefa) => void;
}

// Tela cheia: cobre tudo menos o topo do site (#topbar), por isso a altura do topo é medida em vez de fixa.
export function PostagensSemanaView({ days, byDay, label, toKey, onBack, onPrev, onNext, onToday, onOpenDetail }: Props) {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setTop(document.getElementById("topbar")?.offsetHeight ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const hoje = toKey(new Date());
  const total = days.reduce((n, d) => n + (byDay.get(toKey(d))?.length ?? 0), 0);

  return (
    <div className="ps-overlay" style={{ top }}>
      <div className="ps-header">
        <button className="btn btn-ghost" onClick={onBack}>
          <i className="fas fa-arrow-left" /> Voltar
        </button>
        <div className="ps-title">
          <h2>Postagens da Semana</h2>
          <span>
            {label} · {total} {total === 1 ? "postagem" : "postagens"}
          </span>
        </div>
        <div className="ps-nav">
          <button className="btn btn-ghost icon-btn" onClick={onPrev} title="Semana anterior">
            <i className="fas fa-chevron-left" />
          </button>
          <button className="btn btn-ghost" onClick={onToday}>
            Hoje
          </button>
          <button className="btn btn-ghost icon-btn" onClick={onNext} title="Próxima semana">
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      </div>

      <div className="ps-grid">
        {days.map((d) => {
          const key = toKey(d);
          const posts = byDay.get(key) ?? [];
          return (
            <div key={key} className={`ps-day${key === hoje ? " today" : ""}`}>
              <div className="ps-day-head">
                <span className="ps-day-name">{WEEKDAYS_LONGO[d.getDay()]}</span>
                <span className="ps-day-num">{d.getDate()}</span>
              </div>
              <div className="ps-day-body">
                {posts.length === 0 ? (
                  <div className="ps-empty">Sem postagens</div>
                ) : (
                  posts.map((t) => (
                    <div
                      key={t.id}
                      className="ps-post"
                      style={{ ["--ps-color" as string]: STATUS_COLORS[t.status] || "var(--gray)" }}
                      onClick={() => onOpenDetail(t)}
                    >
                      <div className="ps-post-time">{t.horarioPublicacao || "—"}</div>
                      <div className="ps-post-chips">
                        {t.tipo && <span className="ps-chip">{t.tipo}</span>}
                        {t.redeSocial && <span className="ps-chip ps-chip-rede">{t.redeSocial}</span>}
                      </div>
                      <div className="ps-post-title">{t.tarefa}</div>
                      <div className="ps-post-foot">
                        <span className="ps-post-resp">
                          <Avatar name={t.responsavel} size={22} /> {t.responsavel}
                        </span>
                        <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
