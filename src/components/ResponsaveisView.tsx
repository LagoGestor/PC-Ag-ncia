"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RESPONSAVEIS_VISIVEIS, STATUS_COLORS, Tarefa, ResponsabilidadeFixa, slugify } from "@/types";
import { Avatar } from "./Avatar";
import { useSession } from "./SessionProvider";
import { canWrite } from "@/lib/permissions";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ResponsabilidadeFixaModal } from "./ResponsabilidadeFixaModal";
import { ConfirmModal } from "./ConfirmModal";

type Modo = "time" | "detalhamento" | "fixas";

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
  const [fixas, setFixas] = useState<ResponsabilidadeFixa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResponsabilidadeFixa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResponsabilidadeFixa | null>(null);
  const session = useSession();
  const writable = canWrite(session);
  const { toasts, toast } = useToasts();

  function carregarFixas() {
    fetch("/api/responsabilidades-fixas")
      .then((r) => r.json())
      .then(setFixas)
      .catch(() => toast("Erro ao carregar responsabilidades fixas", "error"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregarFixas, []);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: ResponsabilidadeFixa) {
    setEditing(r);
    setModalOpen(true);
  }

  async function handleSave(data: { responsavel: string; atividade: string; descricao: string }, id?: string) {
    try {
      const res = await fetch(id ? `/api/responsabilidades-fixas/${id}` : "/api/responsabilidades-fixas", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const salvo = await res.json();
      setFixas((prev) => (id ? prev.map((r) => (r.id === id ? salvo : r)) : [...prev, salvo]));
      toast(id ? "Responsabilidade atualizada!" : "Responsabilidade cadastrada!", "success");
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar responsabilidade", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/responsabilidades-fixas/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setFixas((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast("Responsabilidade removida", "info");
    } catch {
      toast("Erro ao remover responsabilidade", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Responsáveis</h2>
          <p className="fixas-subtitle">Toque em uma pessoa para abrir a lista de tarefas exclusiva dela.</p>
        </div>
        {modo === "fixas" && writable && (
          <button className="btn btn-accent" onClick={openNew}>
            <i className="fas fa-plus" /> Responsabilidade Fixa
          </button>
        )}
      </div>

      <div className="agenda-toggle" style={{ marginBottom: 18 }}>
        <button className={modo === "time" ? "active" : ""} onClick={() => setModo("time")}>
          Time
        </button>
        <button className={modo === "detalhamento" ? "active" : ""} onClick={() => setModo("detalhamento")}>
          Em atividade
        </button>
        <button className={modo === "fixas" ? "active" : ""} onClick={() => setModo("fixas")}>
          Responsabilidades Fixas
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
      ) : modo === "detalhamento" ? (
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
      ) : (
        <div className="detalhamento-list">
          {RESPONSAVEIS_VISIVEIS.map((r) => (
            <ResponsabilidadesFixasCard
              key={r}
              nome={r}
              href={`/mobile/${slugify(r)}`}
              itens={fixas.filter((f) => f.responsavel === r)}
              onOpen={openEdit}
            />
          ))}
        </div>
      )}

      <ToastContainer toasts={toasts} />

      <ResponsabilidadeFixaModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={
          writable
            ? (r) => {
                setModalOpen(false);
                setDeleteTarget(r);
              }
            : undefined
        }
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Apagar responsabilidade fixa?"
        text={`Apagar "${deleteTarget?.atividade || "esta responsabilidade"}" permanentemente?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
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

function ResponsabilidadesFixasCard({
  nome,
  href,
  itens,
  onOpen,
}: {
  nome: string;
  href: string;
  itens: ResponsabilidadeFixa[];
  onOpen: (r: ResponsabilidadeFixa) => void;
}) {
  return (
    <div className="detalhamento-card">
      <Link href={href} className="detalhamento-card-header">
        <Avatar name={nome} size={28} />
        <span>{nome}</span>
      </Link>
      <div className="detalhamento-tasks">
        {itens.length === 0 ? (
          <div className="fixas-empty">Nenhuma responsabilidade fixa</div>
        ) : (
          itens.map((r) => (
            <div key={r.id} className="detalhamento-task-row">
              <span className="detalhamento-task-title" onClick={() => onOpen(r)}>
                {r.atividade}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
