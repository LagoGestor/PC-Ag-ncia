"use client";

import { useState } from "react";
import { RESPONSAVEL_ARMAZENAR, Status, Tarefa } from "@/types";
import { api } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { SummaryBar } from "./SummaryBar";
import { MobileTaskCard } from "./MobileTaskCard";
import { TaskModal } from "./TaskModal";
import { CronogramaSemanalView } from "./CronogramaSemanalView";
import { useSession } from "./SessionProvider";
import { canWrite, canChangeStatus } from "@/lib/permissions";

interface Props {
  responsavel: string;
  initialTarefas: Tarefa[];
}

export function MobilePessoaClient({ responsavel, initialTarefas }: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(initialTarefas);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCronograma, setShowCronograma] = useState(false);
  const { toasts, toast } = useToasts();
  const session = useSession();
  const writable = canWrite(session);
  const canToggleStatus = canChangeStatus(session, responsavel);

  const filtradas = statusFilter ? tarefas.filter((t) => t.status === statusFilter) : tarefas;

  async function handleCreate(data: Omit<Tarefa, "id" | "arquivada" | "fixa" | "diaSemana">) {
    try {
      const created = await api.create(data);
      if (created.responsavel === responsavel) {
        setTarefas((prev) => [...prev, created].sort((a, b) => (a.entrega || "9999").localeCompare(b.entrega || "9999")));
      }
      toast(
        created.responsavel === RESPONSAVEL_ARMAZENAR ? "Tarefa guardada em Armazenar!" : "Tarefa criada!",
        "success"
      );
      setModalOpen(false);
    } catch {
      toast("Erro ao criar tarefa", "error");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const updated = await api.update(id, { status: status as Status });
      setTarefas((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast("Status atualizado!", "success");
    } catch {
      toast("Erro ao atualizar status", "error");
    }
  }

  return (
    <>
      <SummaryBar tarefas={tarefas} statusFilter={statusFilter} onToggle={(s) => setStatusFilter((cur) => (cur === s ? null : s))} />

      <div className="mobile-actions-row">
        {writable && (
          <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="fas fa-plus" /> Nova Tarefa
          </button>
        )}
        <button
          className={`btn ${showCronograma ? "btn-accent" : "btn-ghost"}`}
          style={{ marginTop: 10 }}
          onClick={() => setShowCronograma((v) => !v)}
        >
          <i className="fas fa-calendar-week" /> Cronograma de Postagens
        </button>
      </div>

      {showCronograma ? (
        <CronogramaSemanalView />
      ) : (
        <div className="mobile-list">
          {filtradas.length === 0 ? (
            <p className="mobile-empty">
              {statusFilter ? `Nenhuma tarefa com status "${statusFilter}".` : `Nenhuma tarefa para ${responsavel} no momento.`}
            </p>
          ) : (
            filtradas.map((t) => (
              <MobileTaskCard key={t.id} t={t} onStatusChange={canToggleStatus ? handleStatusChange : undefined} />
            ))
          )}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        editing={null}
        onClose={() => setModalOpen(false)}
        onSave={(data) => handleCreate(data)}
        onGenerate={() => {}}
        responsaveisOptions={[RESPONSAVEL_ARMAZENAR, responsavel]}
        defaultResponsavel={responsavel}
      />

      <ToastContainer toasts={toasts} />
    </>
  );
}
