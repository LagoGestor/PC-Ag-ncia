"use client";

import { useEffect, useState } from "react";
import { Reuniao } from "@/types";
import { reunioesApi, assuntosApi } from "@/lib/reunioesApi";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "@/components/ToastContainer";
import { ReuniaoModal } from "@/components/ReuniaoModal";
import { AssuntoModal } from "@/components/AssuntoModal";

function fmtDate(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

export function ReunioesView() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assuntoModalFor, setAssuntoModalFor] = useState<string | null>(null);

  const { toasts, toast } = useToasts();

  useEffect(() => {
    reunioesApi
      .list()
      .then(setReunioes)
      .catch(() => toast("Erro ao carregar reuniões", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveReuniao(data: { data: string; participantes: string; modalidade: string }) {
    try {
      const created = await reunioesApi.create(data);
      setReunioes((prev) => [created, ...prev]);
      toast("Reunião criada!", "success");
      setModalOpen(false);
    } catch {
      toast("Erro ao criar reunião", "error");
    }
  }

  async function handleSaveAssunto(data: {
    tema: string;
    descricao: string;
    encaminhamento: string;
    responsavel: string;
  }) {
    if (!assuntoModalFor) return;
    try {
      const created = await assuntosApi.create({ ...data, reuniaoId: assuntoModalFor });
      setReunioes((prev) =>
        prev.map((r) => (r.id === assuntoModalFor ? { ...r, assuntos: [...r.assuntos, created] } : r))
      );
      toast("Assunto adicionado!", "success");
      setAssuntoModalFor(null);
    } catch {
      toast("Erro ao adicionar assunto", "error");
    }
  }

  return (
    <div>
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Pauta de Reunião</h2>
          <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={() => setModalOpen(true)}>
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
                  <i className={`fas fa-chevron-${expanded ? "up" : "down"}`} />
                </div>

                {expanded && (
                  <div className="reuniao-assuntos">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssuntoModalFor(r.id);
                      }}
                    >
                      <i className="fas fa-plus" /> Novo Assunto
                    </button>

                    {r.assuntos.length === 0 ? (
                      <div className="fixas-empty">Nenhum assunto registrado</div>
                    ) : (
                      r.assuntos.map((a) => (
                        <div key={a.id} className="assunto-card" onClick={(e) => e.stopPropagation()}>
                          <div className="assunto-tema">{a.tema}</div>
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

      <ReuniaoModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveReuniao} />
      <AssuntoModal open={!!assuntoModalFor} onClose={() => setAssuntoModalFor(null)} onSave={handleSaveAssunto} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
