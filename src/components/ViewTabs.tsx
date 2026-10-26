"use client";

import Link from "next/link";
import { View } from "@/types";
import { useSession } from "./SessionProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { canWrite } from "@/lib/permissions";

interface Props {
  // Tela atual da página principal (null fora dela, ex.: Aniversariantes).
  view: View | null;
  // Na página principal troca a visualização sem recarregar; fora dela (sem onSelect) os itens são links pra "/?view=...".
  onSelect?: (v: View) => void;
  // Itens que são páginas próprias (não visualizações da principal).
  ativo?: "aniversariantes" | "performance";
}

// Abas do menu superior — usadas na página principal e nas páginas avulsas (Aniversariantes, Logins), pra
// que o menu não "suma" ao sair da principal.
export function ViewTabs({ view, onSelect, ativo }: Props) {
  const session = useSession();
  const isMobile = useIsMobile();
  const writable = canWrite(session);
  const isDiretor = session?.nivel === "DIRETOR_CONTEUDO";
  const meuResponsavel = isDiretor ? session?.responsavel ?? "" : "";

  const icon = (c: string) => (isMobile ? null : <i className={`fas ${c}`} />);

  function aba(v: View, iconClass: string, label: string, title?: string) {
    const cls = `tab-btn${view === v ? " active" : ""}`;
    const conteudo = (
      <>
        {icon(iconClass)} {label}
      </>
    );
    return onSelect ? (
      <button key={v} className={cls} onClick={() => onSelect(v)} title={title}>
        {conteudo}
      </button>
    ) : (
      <Link key={v} href={`/?view=${v}`} className={cls} title={title}>
        {conteudo}
      </Link>
    );
  }

  function pagina(key: "aniversariantes" | "performance", href: string, iconClass: string, label: string) {
    return (
      <Link key={key} href={href} className={`tab-btn${ativo === key ? " active" : ""}`}>
        {icon(iconClass)} {label}
      </Link>
    );
  }

  return (
    <>
      {!isDiretor && aba("tabela", "fa-table", "LISTA")}
      {!isDiretor && aba("responsaveis", "fa-users", "TIME")}
      {isDiretor && meuResponsavel && aba("minhas", "fa-user-check", "MINHAS TAREFAS")}
      {aba("agenda", "fa-calendar-days", "AGENDA")}
      {!isDiretor && aba("reunioes", "fa-people-group", "REUNIÃO")}
      {aba("semanal", "fa-repeat", isMobile ? "FIXO" : "FIXOS")}
      {!isDiretor && !isMobile && aba("direcionar", "fa-arrow-right-arrow-left", "DIRECIONAR")}
      {!isDiretor && !isMobile && aba("kanban", "fa-columns", "KANBAN")}
      {writable && !isDiretor && pagina("performance", "/performance", "fa-chart-line", "PERFORMANCE")}
      {writable && pagina("aniversariantes", "/aniversariantes", "fa-cake-candles", "ANIVERSARIANTES")}
      {!isDiretor &&
        (isMobile
          ? aba("arquivadas", "fa-box-archive", "", "Arquivo")
          : aba("arquivadas", "fa-box-archive", "ARQUIVO"))}
    </>
  );
}
