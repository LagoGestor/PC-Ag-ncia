"use client";

import { useEffect, useMemo, useState } from "react";
import { Aniversariante, fmtDiaMes } from "@/types";
import { ehAniversarioHoje, ehAniversarioNaSemana, ordenarPorProximoAniversario } from "@/lib/aniversariantes";
import { useToasts } from "@/hooks/useToasts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSession } from "./SessionProvider";
import { canWrite } from "@/lib/permissions";
import { ToastContainer } from "./ToastContainer";
import { AniversarianteModal } from "./AniversarianteModal";
import { ConfirmModal } from "./ConfirmModal";

type SavePayload = { nome: string; ministerio: string; cargo: string; instagram: string; dia: number | null; mes: number | null };

function destaqueClasse(a: Aniversariante): string {
  if (ehAniversarioHoje(a)) return "aniversariante-hoje";
  if (ehAniversarioNaSemana(a)) return "aniversariante-semana";
  return "";
}

export function AniversariantesView() {
  const [lista, setLista] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Aniversariante | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Aniversariante | null>(null);
  const { toasts, toast } = useToasts();
  const isMobile = useIsMobile();
  const session = useSession();
  const writable = canWrite(session);

  function carregar() {
    fetch("/api/aniversariantes")
      .then((r) => r.json())
      .then((data) => setLista(data))
      .catch(() => toast("Erro ao carregar aniversariantes", "error"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, []);

  const filtrada = useMemo(() => {
    const base = ordenarPorProximoAniversario(lista);
    if (!busca.trim()) return base;
    const q = busca.toLowerCase();
    return base.filter((a) => a.nome.toLowerCase().includes(q) || a.ministerio.toLowerCase().includes(q));
  }, [lista, busca]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(a: Aniversariante) {
    setEditing(a);
    setModalOpen(true);
  }

  async function handleSave(data: SavePayload, id?: string) {
    try {
      const res = await fetch(id ? `/api/aniversariantes/${id}` : "/api/aniversariantes", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const salvo = await res.json();
      setLista((prev) => (id ? prev.map((a) => (a.id === id ? salvo : a)) : [...prev, salvo]));
      toast(id ? "Aniversariante atualizado!" : "Aniversariante cadastrado!", "success");
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar aniversariante", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/aniversariantes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLista((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast("Aniversariante removido", "info");
    } catch {
      toast("Erro ao remover aniversariante", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="performance-shell">
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Aniversariantes</h2>
          <p className="fixas-subtitle">Pastores e líderes do ministério</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome ou ministério..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          {writable && (
            <button className="btn btn-accent" onClick={openNew}>
              <i className="fas fa-plus" /> Aniversariante
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Carregando...</p>
        </div>
      ) : filtrada.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum aniversariante encontrado.</p>
        </div>
      ) : isMobile ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Cargo</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.map((a) => (
                <tr
                  key={a.id}
                  className={destaqueClasse(a)}
                  onClick={writable ? () => openEdit(a) : undefined}
                  style={writable ? { cursor: "pointer" } : undefined}
                >
                  <td>{fmtDiaMes(a.dia, a.mes)}</td>
                  <td>
                    <b>{a.nome}</b>
                  </td>
                  <td>{a.cargo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Ministério(s)</th>
                <th>Cargo Eclesiástico</th>
                <th>Instagram</th>
                {writable && <th style={{ textAlign: "center" }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtrada.map((a) => (
                <tr key={a.id} className={destaqueClasse(a)}>
                  <td>{fmtDiaMes(a.dia, a.mes)}</td>
                  <td>
                    <b>{a.nome}</b>
                  </td>
                  <td>{a.ministerio || "—"}</td>
                  <td>{a.cargo || "—"}</td>
                  <td>
                    {a.instagram ? (
                      <a href={`https://instagram.com/${a.instagram}`} target="_blank" rel="noreferrer">
                        @{a.instagram}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {writable && (
                    <td>
                      <div className="tbl-actions">
                        <button className="tbl-action-icon" onClick={() => openEdit(a)} title="Editar">
                          <i className="fas fa-pen" />
                        </button>
                        <button className="tbl-action-icon danger" onClick={() => setDeleteTarget(a)} title="Apagar">
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ToastContainer toasts={toasts} />

      {writable && (
        <>
          <AniversarianteModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />

          <ConfirmModal
            open={!!deleteTarget}
            title="Apagar aniversariante?"
            text={`Apagar "${deleteTarget?.nome || "este aniversariante"}" permanentemente?`}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        </>
      )}
    </div>
  );
}
