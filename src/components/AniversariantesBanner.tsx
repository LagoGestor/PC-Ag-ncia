"use client";

import { useEffect, useMemo, useState } from "react";
import { Aniversariante, fmtDiaMes } from "@/types";
import { diasAteProximoAniversario, ehCargoPastoral, ehAniversarioNosProximosDias, ordenarPorProximoAniversario } from "@/lib/aniversariantes";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { AniversarianteModal } from "./AniversarianteModal";

type SavePayload = { nome: string; ministerio: string; cargo: string; instagram: string; dia: number | null; mes: number | null };

const JANELA_DIAS = 15;

interface Props {
  // Executor não pode editar/cadastrar aniversariante — só ver nome, data e os destaques.
  editable?: boolean;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

function quando(dias: number) {
  return dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : `em ${dias} dias`;
}

export function AniversariantesBanner({ editable = true }: Props) {
  const [lista, setLista] = useState<Aniversariante[] | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState<Aniversariante | null>(null);
  const { toasts, toast } = useToasts();

  useEffect(() => {
    fetch("/api/aniversariantes")
      .then((r) => r.json())
      .then(setLista)
      .catch(() => setLista([]));
  }, []);

  const proximos = useMemo(() => {
    const base = lista ?? [];
    return ordenarPorProximoAniversario(base.filter((a) => ehAniversarioNosProximosDias(a, JANELA_DIAS)));
  }, [lista]);

  async function handleSave(data: SavePayload, id?: string) {
    if (!id) return;
    try {
      const res = await fetch(`/api/aniversariantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const salvo = await res.json();
      setLista((prev) => (prev ? prev.map((a) => (a.id === id ? salvo : a)) : prev));
      toast("Aniversariante atualizado!", "success");
      setEditing(null);
    } catch {
      toast("Erro ao salvar aniversariante", "error");
    }
  }

  if (dismissed || !lista || proximos.length === 0) return null;

  return (
    <div className="aniversariantes-banner">
      <div className="aniversariantes-banner-body">
        <span className="aniversariantes-banner-title">
          <i className="fas fa-cake-candles" /> Próximos aniversários
          <span className="aniv-count">
            {proximos.length} nos próximos {JANELA_DIAS} dias
          </span>
        </span>
        <div className="aniv-row">
          {proximos.map((a) => {
            const dias = diasAteProximoAniversario(a.dia!, a.mes!);
            const conteudo = (
              <>
                <span className="aniv-avatar">
                  {iniciais(a.nome)}
                  {ehCargoPastoral(a.cargo) && <i className="fas fa-star aniv-star" title="Pastor(a)" />}
                </span>
                <span className="aniv-info">
                  <span className="aniv-nome">{a.nome}</span>
                  <span className="aniv-quando">{quando(dias)}</span>
                </span>
                <span className="aniv-data">{fmtDiaMes(a.dia, a.mes)}</span>
              </>
            );
            const cls = `aniv-card${dias === 0 ? " hoje" : ""}`;
            return editable ? (
              <button key={a.id} className={cls} onClick={() => setEditing(a)}>
                {conteudo}
              </button>
            ) : (
              <div key={a.id} className={`${cls} aniv-card-static`}>
                {conteudo}
              </div>
            );
          })}
        </div>
      </div>
      <button className="aniversariantes-banner-close" onClick={() => setDismissed(true)} title="Fechar">
        <i className="fas fa-times" />
      </button>

      {editable && (
        <>
          <ToastContainer toasts={toasts} />
          <AniversarianteModal open={!!editing} editing={editing} onClose={() => setEditing(null)} onSave={handleSave} />
        </>
      )}
    </div>
  );
}
