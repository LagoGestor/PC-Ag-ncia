"use client";

import { useEffect, useMemo, useState } from "react";
import { Aniversariante, fmtDiaMes } from "@/types";
import { ehAniversarioHoje, ehAniversarioNaSemana, ehAniversarioNoMes, ordenarPorProximoAniversario } from "@/lib/aniversariantes";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { AniversarianteModal } from "./AniversarianteModal";

type SavePayload = { nome: string; ministerio: string; cargo: string; instagram: string; dia: number | null; mes: number | null };

function Grupo({ titulo, lista, onClickNome }: { titulo: string; lista: Aniversariante[]; onClickNome: (a: Aniversariante) => void }) {
  if (lista.length === 0) return null;
  return (
    <div className="aniversariantes-banner-grupo">
      <span className="aniversariantes-banner-grupo-titulo">{titulo}</span>
      <div className="aniversariantes-banner-chips">
        {lista.map((a) => (
          <button key={a.id} className="aniversariantes-banner-chip" onClick={() => onClickNome(a)}>
            {a.nome} <span>{fmtDiaMes(a.dia, a.mes)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AniversariantesBanner() {
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

  const { doMes, daSemana, deHoje } = useMemo(() => {
    const base = lista ?? [];
    return {
      doMes: ordenarPorProximoAniversario(base.filter((a) => ehAniversarioNoMes(a))),
      daSemana: ordenarPorProximoAniversario(base.filter((a) => ehAniversarioNaSemana(a))),
      deHoje: base.filter((a) => ehAniversarioHoje(a)),
    };
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

  if (dismissed || !lista || (doMes.length === 0 && daSemana.length === 0 && deHoje.length === 0)) return null;

  return (
    <div className="aniversariantes-banner">
      <div className="aniversariantes-banner-body">
        <span className="aniversariantes-banner-title">
          <i className="fas fa-cake-candles" /> Aniversariantes
        </span>
        <Grupo titulo="Aniversariantes do mês" lista={doMes} onClickNome={setEditing} />
        <Grupo titulo="Aniversariantes da semana" lista={daSemana} onClickNome={setEditing} />
        <Grupo titulo="Aniversariantes de hoje" lista={deHoje} onClickNome={setEditing} />
      </div>
      <button className="aniversariantes-banner-close" onClick={() => setDismissed(true)} title="Fechar">
        <i className="fas fa-times" />
      </button>

      <ToastContainer toasts={toasts} />
      <AniversarianteModal open={!!editing} editing={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </div>
  );
}
