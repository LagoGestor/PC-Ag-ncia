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
  titulo?: string;
  // Executor não pode editar/cadastrar aniversariante — só ver nome, data e os destaques.
  editable?: boolean;
}

export function AniversariantesBanner({ titulo = "Aniversariantes do mês", editable = true }: Props) {
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
          <i className="fas fa-cake-candles" /> {titulo}
        </span>
        <div className="aniversariantes-banner-chips">
          {proximos.map((a) => {
            const hoje = a.dia && a.mes && diasAteProximoAniversario(a.dia, a.mes) === 0;
            const pastoral = ehCargoPastoral(a.cargo);
            const conteudo = (
              <>
                {pastoral && <i className="fas fa-star aniversariante-icone-pastor" title="Pastor(a)" />} {a.nome}{" "}
                <span>{fmtDiaMes(a.dia, a.mes)}</span>
              </>
            );
            return editable ? (
              <button key={a.id} className={`aniversariantes-banner-chip${hoje ? " hoje" : ""}`} onClick={() => setEditing(a)}>
                {conteudo}
              </button>
            ) : (
              <span key={a.id} className={`aniversariantes-banner-chip aniversariantes-banner-chip-static${hoje ? " hoje" : ""}`}>
                {conteudo}
              </span>
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
