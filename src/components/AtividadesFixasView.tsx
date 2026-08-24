"use client";

import { DIAS_SEMANA, Tarefa } from "@/types";
import { Avatar } from "./Avatar";
import { useIsMobile } from "@/hooks/useIsMobile";

const TIPO_COLORS: Record<string, string> = {
  Post: "#ef4444",
  Reels: "#38bdf8",
  Story: "#c084fc",
  "Carrossel Design": "#8b5cf6",
  "Carrossel Simples": "#4ade80",
  Card: "#f97316",
  VOD: "#f472b6",
  Wathsapp: "#22c55e",
  "Gráfica": "#fb923c",
  LED: "#facc15",
  Site: "#60a5fa",
  PPT: "#f87171",
  PDF: "#f87171",
  Thumbnail: "#2dd4bf",
  "Fotografia": "#fbbf24",
  "Documentação": "#94a3b8",
  Outro: "#6b7280",
};

function tipoColor(tipo: string) {
  return TIPO_COLORS[tipo] || "#6b7280";
}

interface Props {
  list: Tarefa[];
  onOpenDetail: (t: Tarefa) => void;
}

export function AtividadesFixasView({ list, onOpenDetail }: Props) {
  const isMobile = useIsMobile();
  const byDay = new Map<string, Tarefa[]>();
  for (const t of list) {
    const dia = t.diaSemana || "Sem dia";
    const arr = byDay.get(dia) ?? [];
    arr.push(t);
    byDay.set(dia, arr);
  }

  const tiposUsados = Array.from(new Set(list.map((t) => t.tipo).filter(Boolean)));

  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">{isMobile ? "Atividades fixas da semana" : "Atividades da Semana"}</h2>
          <p className="fixas-subtitle">Rotina fixa de Comunicação — se repete toda semana, sempre nos mesmos dias.</p>
        </div>
        {tiposUsados.length > 0 && (
          <div className="fixas-legend">
            {tiposUsados.map((tp) => (
              <div key={tp} className="fixas-legend-item">
                <span className="fixas-legend-dot" style={{ background: tipoColor(tp) }} />
                {tp}
              </div>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-repeat" />
          <h3>Nenhuma atividade fixa</h3>
          <p>As atividades recorrentes da semana aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid-scroll-wrap">
        <div className="fixas-grid">
          {DIAS_SEMANA.map((dia) => {
            const items = byDay.get(dia) ?? [];
            return (
              <div key={dia} className="fixas-col">
                <div className="fixas-col-header">
                  <span className="fixas-col-name">{dia}</span>
                  <span className="fixas-col-count">{items.length}</span>
                </div>
                <div className="fixas-col-body">
                  {items.length === 0 ? (
                    <div className="fixas-empty">Sem atividades</div>
                  ) : (
                    items.map((t) => (
                      <div key={t.id} className="fixas-item" style={{ ["--tipo-color" as string]: tipoColor(t.tipo) }}>
                        {t.tipo && <div className="fixas-item-tipo">{t.tipo}</div>}
                        <div className="fixas-item-title" onClick={() => onOpenDetail(t)} title="Ver detalhes">
                          {t.tarefa}
                        </div>
                        <div className="fixas-item-resp">
                          <Avatar name={t.responsavel} />
                          <span>{t.responsavel}</span>
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
      )}
    </div>
  );
}
