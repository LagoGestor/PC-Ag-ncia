"use client";

import { useState } from "react";
import Link from "next/link";
import { RESPONSAVEIS_VISIVEIS, STATUS_COLORS, Tarefa, slugify } from "@/types";
import { Avatar } from "./Avatar";

type Modo = "time" | "detalhamento";

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
}

function fmtDiaMes(d: string) {
  if (!d) return "—";
  const [, mes, dia] = d.split("-");
  return `${dia}/${mes}`;
}

function ordenarPorEntrega(list: Tarefa[]) {
  return [...list].sort((a, b) => {
    if (!a.entrega && !b.entrega) return 0;
    if (!a.entrega) return 1;
    if (!b.entrega) return -1;
    return a.entrega.localeCompare(b.entrega);
  });
}

export function ResponsaveisView({ list, onEdit }: Props) {
  const [modo, setModo] = useState<Modo>("time");

  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Responsáveis</h2>
          <p className="fixas-subtitle">Toque em uma pessoa para abrir a lista de tarefas exclusiva dela.</p>
        </div>
      </div>

      <div className="agenda-toggle" style={{ marginBottom: 18 }}>
        <button className={modo === "time" ? "active" : ""} onClick={() => setModo("time")}>
          Time
        </button>
        <button className={modo === "detalhamento" ? "active" : ""} onClick={() => setModo("detalhamento")}>
          Detalhamento
        </button>
      </div>

      {modo === "time" ? (
        <div className="resp-grid">
          <Link href="/mobile" className="resp-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="avatar-badge avatar-badge-photo" style={{ width: 96, height: 96 }} src="/img/perfil_agencia.jpg" alt="Geral" />
            <span className="resp-card-name">Geral</span>
          </Link>
          {RESPONSAVEIS_VISIVEIS.map((r) => (
            <Link key={r} href={`/mobile/${slugify(r)}`} className="resp-card">
              <Avatar name={r} size={96} />
              <span className="resp-card-name">{r}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="detalhamento-list">
          {RESPONSAVEIS_VISIVEIS.map((r) => (
            <DetalhamentoCard
              key={r}
              nome={r}
              href={`/mobile/${slugify(r)}`}
              tasks={ordenarPorEntrega(list.filter((t) => t.responsavel === r))}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DetalhamentoCard({
  nome,
  href,
  tasks,
  onEdit,
}: {
  nome: string;
  href: string;
  tasks: Tarefa[];
  onEdit: (t: Tarefa) => void;
}) {
  return (
    <div className="detalhamento-card">
      <Link href={href} className="detalhamento-card-header">
        <Avatar name={nome} size={28} />
        <span>{nome}</span>
      </Link>
      <div className="detalhamento-tasks">
        {tasks.length === 0 ? (
          <div className="fixas-empty">Nenhuma tarefa</div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="detalhamento-task-row">
              <span
                className="detalhamento-task-title"
                style={{ color: STATUS_COLORS[t.status] || undefined }}
                onClick={() => onEdit(t)}
              >
                {t.tarefa}
              </span>
              <span className="detalhamento-task-date">{fmtDiaMes(t.entrega)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
