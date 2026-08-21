"use client";

import { MouseEvent, useEffect, useState } from "react";
import { Assunto, Reuniao } from "@/types";
import { reunioesApi, assuntosApi } from "@/lib/reunioesApi";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "@/components/ToastContainer";
import { ReuniaoModal } from "@/components/ReuniaoModal";
import { AssuntoModal } from "@/components/AssuntoModal";
import { ConfirmModal } from "@/components/ConfirmModal";

function fmtDate(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

type DeleteTarget = { type: "reuniao"; id: string } | { type: "assunto"; id: string };

export function ReunioesView() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<Reuniao | null>(null);

  const [assuntoModalOpen, setAssuntoModalOpen] = useState(false);
  const [assuntoReuniaoId, setAssuntoReuniaoId] = useState<string | null>(null);
  const [editingAssunto, setEditingAssunto] = useState<Assunto | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const { toasts, toast } = useToasts();

  useEffect(() => {
    reunioesApi
      .list()
      .then(setReunioes)
      .catch(() => toast("Erro ao carregar reuniões", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNewReuniao() {
    setEditingReuniao(null);
    setModalOpen(true);
  }

  function openEditReuniao(r: Reuniao, e: MouseEvent) {
    e.stopPropagation();
    setEditingReuniao(r);
    setModalOpen(true);
  }

  function openNewAssunto(reuniaoId: string, e: MouseEvent) {
    e.stopPropagation();
    setAssuntoReuniaoId(reuniaoId);
    setEditingAssunto(null);
    setAssuntoModalOpen(true);
  }

  function openEditAssunto(a: Assunto, e: MouseEvent) {
    e.stopPropagation();
    setAssuntoReuniaoId(a.reuniaoId);
    setEditingAssunto(a);
    setAssuntoModalOpen(true);
  }

  async function handleSaveReuniao(data: { data: string; participantes: string; modalidade: string }, id?: string) {
    try {
      if (id) {
        const updated = await reunioesApi.update(id, data);
        setReunioes((prev) => prev.map((r) => (r.id === id ? updated : r)));
        toast("Reunião atualizada!", "success");
      } else {
        const created = await reunioesApi.create(data);
        setReunioes((prev) => [created, ...prev]);
        toast("Reunião criada!", "success");
      }
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar reunião", "error");
    }
  }

  async function handleSaveAssunto(
    data: { tema: string; descricao: string; encaminhamento: string; responsavel: string },
    id?: string
  ) {
    if (!assuntoReuniaoId) return;
    try {
      if (id) {
        const updated = await assuntosApi.update(id, data);
        setReunioes((prev) =>
          prev.map((r) =>
            r.id === assuntoReuniaoId ? { ...r, assuntos: r.assuntos.map((a) => (a.id === id ? updated : a)) } : r
          )
        );
        toast("Assunto atualizado!", "success");
      } else {
        const created = await assuntosApi.create({ ...data, reuniaoId: assuntoReuniaoId });
        setReunioes((prev) =>
          prev.map((r) => (r.id === assuntoReuniaoId ? { ...r, assuntos: [...r.assuntos, created] } : r))
        );
        toast("Assunto adicionado!", "success");
      }
      setAssuntoModalOpen(false);
    } catch {
      toast("Erro ao salvar assunto", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "reuniao") {
        await reunioesApi.remove(deleteTarget.id);
        setReunioes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        if (expandedId === deleteTarget.id) setExpandedId(null);
        toast("Reunião apagada", "info");
      } else {
        await assuntosApi.remove(deleteTarget.id);
        setReunioes((prev) => prev.map((r) => ({ ...r, assuntos: r.assuntos.filter((a) => a.id !== deleteTarget.id) })));
        toast("Assunto apagado", "info");
      }
    } catch {
      toast("Erro ao apagar", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Pauta de Reunião</h2>
          <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={openNewReuniao}>
            <i className="fas fa-plus" /> Nova Reunião
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Carregando...</p>
        </div>
      ) : reunioes.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-people-group" />
          <h3>Nenhuma reunião cadastrada</h3>
          <p>Clique em &quot;+ Nova Reunião&quot; para registrar a primeira.</p>
        </div>
      ) : (
        <div className="reuniao-list">
          {reunioes.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} className="reuniao-card">
                <div className="reuniao-card-top" onClick={() => setExpandedId(expanded ? null : r.id)} title="Clique para expandir">
                  <div>
                    <div className="reuniao-card-data">
                      <i className="fas fa-calendar-day" /> {fmtDate(r.data)}
                    </div>
                    <div className="reuniao-card-meta">
                      <span>
                        <i className="fas fa-user-group" /> {r.participantes || "—"}
                      </span>
                      <span className={`card-badge ${r.modalidade === "Online" ? "badge-concluido" : "badge-ativa"}`}>
                        {r.modalidade}
                      </span>
                    </div>
                  </div>
                  <div className="reuniao-card-actions">
                    <button className="card-action-btn" onClick={(e) => openEditReuniao(r, e)} title="Editar">
                      <i className="fas fa-pen" />
                    </button>
                    <button
                      className="card-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ type: "reuniao", id: r.id });
                      }}
                      title="Apagar"
                    >
                      <i className="fas fa-trash" />
                    </button>
                    <i className={`fas fa-chevron-${expanded ? "up" : "down"}`} />
                  </div>
                </div>

                {expanded && (
                  <div className="reuniao-assuntos">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => openNewAssunto(r.id, e)}>
                      <i className="fas fa-plus" /> Novo Assunto
                    </button>

                    {r.assuntos.length === 0 ? (
                      <div className="fixas-empty">Nenhum assunto registrado</div>
                    ) : (
                      r.assuntos.map((a) => (
                        <div key={a.id} className="assunto-card" onClick={(e) => e.stopPropagation()}>
                          <div className="assunto-card-top">
                            <div className="assunto-tema">{a.tema}</div>
                            <div className="reuniao-card-actions">
                              <button className="card-action-btn" onClick={(e) => openEditAssunto(a, e)} title="Editar">
                                <i className="fas fa-pen" />
                              </button>
                              <button
                                className="card-action-btn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({ type: "assunto", id: a.id });
                                }}
                                title="Apagar"
                              >
                                <i className="fas fa-trash" />
                              </button>
                            </div>
                          </div>
                          {a.descricao && (
                            <div className="assunto-field">
                              <span className="assunto-field-label">Descrição</span>
                              {a.descricao}
                            </div>
                          )}
                          {a.encaminhamento && (
                            <div className="assunto-field">
                              <span className="assunto-field-label">Encaminhamento</span>
                              {a.encaminhamento}
                            </div>
                          )}
                          {a.responsavel && (
                            <div className="assunto-field">
                              <span className="assunto-field-label">Responsável</span>
                              {a.responsavel}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReuniaoModal open={modalOpen} editing={editingReuniao} onClose={() => setModalOpen(false)} onSave={handleSaveReuniao} />
      <AssuntoModal
        open={assuntoModalOpen}
        editing={editingAssunto}
        onClose={() => setAssuntoModalOpen(false)}
        onSave={handleSaveAssunto}
      />
      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.type === "reuniao" ? "Apagar reunião?" : "Apagar assunto?"}
        text={
          deleteTarget?.type === "reuniao"
            ? "Isso também apaga todos os assuntos registrados nela. Esta ação não pode ser desfeita."
            : "Esta ação não pode ser desfeita."
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
