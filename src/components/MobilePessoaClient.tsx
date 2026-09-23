"use client";

import { useState } from "react";
import { RESPONSAVEL_ARMAZENAR, Status, Tarefa, TarefaInput } from "@/types";
import { api, nextOccurrence } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ConfirmModal } from "./ConfirmModal";
import { SummaryBar } from "./SummaryBar";
import { AniversariantesBanner } from "./AniversariantesBanner";
import { MobileTaskCard } from "./MobileTaskCard";
import { TaskModal } from "./TaskModal";
import { CronogramaSemanalView } from "./CronogramaSemanalView";
import { AgendaView } from "./AgendaView";
import { AtividadesFixasView } from "./AtividadesFixasView";
import { useSession } from "./SessionProvider";
import { canWrite, canChangeStatus } from "@/lib/permissions";

interface Props {
  // Omitido = modo "todas as tarefas" (usado pelo Diretor de Conteúdo na página /mobile Geral).
  responsavel?: string;
  initialTarefas: Tarefa[];
}

type Aba = "lista" | "cronograma" | "agenda" | "fixos";

export function MobilePessoaClient({ responsavel, initialTarefas }: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(initialTarefas);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tarefa | null>(null);
  const [aba, setAba] = useState<Aba>("lista");
  const { toasts, toast } = useToasts();
  const session = useSession();
  const writable = canWrite(session);
  const canToggleStatus = canChangeStatus(session, responsavel ?? "");
  const todasAsTarefas = !responsavel;

  const naoFixas = tarefas.filter((t) => !t.fixa);
  const fixas = tarefas.filter((t) => t.fixa && !t.arquivada);
  const filtradas = statusFilter ? naoFixas.filter((t) => t.status === statusFilter) : naoFixas;

  function openEdit(t: Tarefa) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleSave(data: TarefaInput, id?: string) {
    try {
      if (id) {
        const updated = await api.update(id, data);
        setTarefas((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast("Tarefa atualizada!", "success");
      } else {
        const created = await api.create(data);
        if (!created.fixa && (todasAsTarefas || created.responsavel === responsavel)) {
          setTarefas((prev) => [...prev, created].sort((a, b) => (a.entrega || "9999").localeCompare(b.entrega || "9999")));
        } else if (created.fixa) {
          setTarefas((prev) => [...prev, created]);
        }
        toast(
          created.responsavel === RESPONSAVEL_ARMAZENAR ? "Tarefa guardada em Armazenar!" : "Tarefa criada!",
          "success"
        );
      }
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar tarefa", "error");
    }
  }

  async function handleGenerateFromFixa(t: Tarefa) {
    const data = nextOccurrence(t.diaSemana);
    try {
      const created = await api.create({
        tarefa: t.tarefa,
        area: t.area,
        tipo: t.tipo,
        responsavel: t.responsavel,
        descricao: t.descricao,
        link: t.link,
        solicitacao: data,
        feedback: "",
        entrega: data,
        horarioPublicacao: "",
        status: "Ativa",
      });
      setTarefas((prev) => [created, ...prev]);
      toast(`"${t.tarefa}" adicionada à lista de tarefas!`, "success");
    } catch {
      toast("Erro ao adicionar tarefa", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.remove(deleteTarget.id);
      setTarefas((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast("Tarefa apagada", "info");
    } catch {
      toast("Erro ao apagar tarefa", "error");
    } finally {
      setDeleteTarget(null);
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
      <SummaryBar tarefas={naoFixas} statusFilter={statusFilter} onToggle={(s) => setStatusFilter((cur) => (cur === s ? null : s))} />

      {!todasAsTarefas && <AniversariantesBanner titulo="Aniversariantes da Semana" editable={false} />}

      <div className="mobile-actions-row">
        {writable && (
          <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="fas fa-plus" /> Nova Tarefa
          </button>
        )}
        <div className="agenda-toggle" style={{ marginTop: 10 }}>
          <button className={aba === "lista" ? "active" : ""} onClick={() => setAba("lista")}>
            Lista
          </button>
          {todasAsTarefas ? (
            <>
              <button className={aba === "agenda" ? "active" : ""} onClick={() => setAba("agenda")}>
                Agenda
              </button>
              <button className={aba === "fixos" ? "active" : ""} onClick={() => setAba("fixos")}>
                Fixos
              </button>
            </>
          ) : (
            <button className={aba === "cronograma" ? "active" : ""} onClick={() => setAba("cronograma")}>
              Cronograma de Postagens
            </button>
          )}
        </div>
      </div>

      {aba === "cronograma" ? (
        <CronogramaSemanalView editable={writable} />
      ) : aba === "agenda" ? (
        <AgendaView list={naoFixas} onOpenDetail={openEdit} />
      ) : aba === "fixos" ? (
        <AtividadesFixasView list={fixas} onOpenDetail={openEdit} />
      ) : (
        <div className="mobile-list">
          {filtradas.length === 0 ? (
            <p className="mobile-empty">
              {statusFilter
                ? `Nenhuma tarefa com status "${statusFilter}".`
                : todasAsTarefas
                  ? "Nenhuma tarefa cadastrada."
                  : `Nenhuma tarefa para ${responsavel} no momento.`}
            </p>
          ) : (
            filtradas.map((t) => (
              <MobileTaskCard
                key={t.id}
                t={t}
                showResponsavel={todasAsTarefas}
                onStatusChange={canToggleStatus ? handleStatusChange : undefined}
              />
            ))
          )}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        editing={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onGenerate={handleGenerateFromFixa}
        onDelete={(t) => {
          setModalOpen(false);
          setEditing(null);
          setDeleteTarget(t);
        }}
        responsaveisOptions={todasAsTarefas ? undefined : [RESPONSAVEL_ARMAZENAR, responsavel!]}
        defaultResponsavel={responsavel}
      />

      <ConfirmModal
        open={!!deleteTarget}
        text={`Apagar "${deleteTarget?.tarefa || "esta tarefa"}" permanentemente?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ToastContainer toasts={toasts} />
    </>
  );
}
