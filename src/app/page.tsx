"use client";

import { useEffect, useMemo, useState } from "react";
import { api, nextOccurrence } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { RESPONSAVEL_ARMAZENAR, Status, Tarefa, TarefaInput, View } from "@/types";
import { useSession } from "@/components/SessionProvider";
import { canWrite } from "@/lib/permissions";
import { Avatar } from "@/components/Avatar";
import { ToastContainer } from "@/components/ToastContainer";
import { SummaryBar } from "@/components/SummaryBar";
import { DashboardView } from "@/components/DashboardView";
import { TabelaView } from "@/components/TabelaView";
import { KanbanView } from "@/components/KanbanView";
import { AgendaView } from "@/components/AgendaView";
import { AtividadesFixasView } from "@/components/AtividadesFixasView";
import { ResponsaveisView } from "@/components/ResponsaveisView";
import { DirecionarView } from "@/components/DirecionarView";
import { ReunioesView } from "@/components/ReunioesView";
import { TaskModal } from "@/components/TaskModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ReportModal } from "@/components/ReportModal";
import { AniversariantesBanner } from "@/components/AniversariantesBanner";
import { NotificacoesItem } from "@/components/NotificacoesItem";
import { ViewTabs } from "@/components/ViewTabs";
import { fmtDate } from "@/components/TaskCard";

const VIEWS_VALIDAS: View[] = ["tabela", "kanban", "arquivadas", "agenda", "semanal", "responsaveis", "direcionar", "reunioes", "minhas"];

export default function Home() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("tabela");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tarefa | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const { toasts, toast } = useToasts();
  const isMobile = useIsMobile();
  const session = useSession();
  const writable = canWrite(session);
  const isDiretor = session?.nivel === "DIRETOR_CONTEUDO";
  const meuResponsavel = isDiretor ? session?.responsavel ?? "" : "";

  useEffect(() => {
    if (isMobile && (view === "kanban" || view === "direcionar")) setView("tabela");
  }, [isMobile, view]);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view") as View | null;
    if (v && VIEWS_VALIDAS.includes(v)) setView(v);
  }, []);

  useEffect(() => {
    if (isDiretor && view !== "agenda" && view !== "semanal" && view !== "minhas") setView("agenda");
  }, [isDiretor, view]);

  useEffect(() => {
    api
      .list()
      .then((data) => setTarefas(data))
      .catch(() => toast("Erro ao carregar tarefas", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  const filtered = useMemo(() => {
    let list = tarefas.filter((t) => {
      if (view === "minhas") return t.responsavel === meuResponsavel && !t.arquivada && !t.fixa;
      if (view === "direcionar") return t.responsavel === RESPONSAVEL_ARMAZENAR;
      if (t.responsavel === RESPONSAVEL_ARMAZENAR) return false;
      if (view === "arquivadas") return t.arquivada;
      if (view === "semanal") return t.fixa && !t.arquivada;
      return !t.arquivada && !t.fixa;
    });
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.tarefa.toLowerCase().includes(q) ||
          t.descricao.toLowerCase().includes(q) ||
          t.responsavel.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tarefas, view, statusFilter, searchQuery, meuResponsavel]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

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
        setTarefas((prev) => [created, ...prev]);
        toast("Tarefa criada!", "success");
      }
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar tarefa", "error");
    }
  }

  async function handleToggleArchive(t: Tarefa) {
    try {
      const updated = await api.update(t.id, { arquivada: !t.arquivada });
      setTarefas((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      toast(updated.arquivada ? "Tarefa arquivada" : "Tarefa restaurada", "info");
    } catch {
      toast("Erro ao arquivar tarefa", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.remove(deleteTarget.id);
      setTarefas((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast("Tarefa apagada", "info");
    } catch {
      toast("Erro ao apagar tarefa", "error");
    } finally {
      setDeleteTarget(null);
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
        linksExtras: t.linksExtras,
        solicitacao: data,
        feedback: "",
        entrega: data,
        horarioPublicacao: t.horarioPublicacao,
        status: "Ativa",
        redeSocial: t.redeSocial,
        origemFixaId: t.id,
      });
      setTarefas((prev) => [created, ...prev]);
      toast(`"${t.tarefa}" adicionada para ${t.diaSemana.toLowerCase()}, ${data.split("-").reverse().slice(0, 2).join("/")} (${t.responsavel}). Veja na Lista ou na Agenda dessa semana.`, "success");
    } catch (e) {
      toast(`Erro ao adicionar tarefa: ${e instanceof Error ? e.message : ""}`, "error");
    }
  }

  async function handleKanbanDrop(id: string, status: Status) {
    const t = tarefas.find((x) => x.id === id);
    if (!t || t.status === status) return;
    try {
      const updated = await api.update(id, { status });
      setTarefas((prev) => prev.map((x) => (x.id === id ? updated : x)));
      toast(`Tarefa movida para ${status}`, "success");
    } catch {
      toast("Erro ao mover tarefa", "error");
    }
  }

  async function gerarRelatorio(inicio: string, fim: string) {
    const list = tarefas.filter(
      (t) =>
        !t.arquivada &&
        !t.fixa &&
        t.responsavel !== RESPONSAVEL_ARMAZENAR &&
        t.entrega &&
        t.entrega >= inicio &&
        t.entrega <= fim
    );

    if (!list.length) {
      toast("Nenhuma atividade encontrada nesse período", "info");
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatório de Atividades", 14, 16);
    doc.setFontSize(10);
    doc.text(`Período: ${fmtDate(inicio)} a ${fmtDate(fim)}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [["Tarefa", "Área", "Tipo", "Responsável", "Status"]],
      body: list.map((t) => [t.tarefa, t.area, t.tipo || "—", t.responsavel, t.status]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 26, 20] },
    });

    doc.save(`relatorio_atividades_${inicio}_a_${fim}.pdf`);
    toast(`Relatório gerado com ${list.length} atividade(s)`, "success");
    setReportModalOpen(false);
  }

  function exportarJSON() {
    const blob = new Blob([JSON.stringify(tarefas, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tarefas_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast("JSON exportado!", "success");
    setDropdownOpen(false);
  }

  function exportarCSV() {
    const cols: (keyof Tarefa)[] = ["tarefa", "area", "responsavel", "descricao", "solicitacao", "feedback", "entrega", "status"];
    const head = cols.join(",");
    const rows = tarefas.map((t) => cols.map((c) => `"${String(t[c] ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([head + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tarefas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast("CSV exportado!", "success");
    setDropdownOpen(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div id="app">
      <div id="topbar">
        <div className="brand">
          <div className="brand-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/icone_logo_agencia.png" alt="Agência LBC" />
          </div>
          <span className="brand-name">Agência LBC</span>
        </div>

        <div className="search-wrap">
          <i className="fas fa-search" />
          <input
            type="text"
            id="globalSearch"
            placeholder="Buscar tarefas, responsáveis, áreas..."
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="top-actions">
          {writable && (
            <button className="btn btn-accent" onClick={openNew}>
              <i className="fas fa-plus" /> Nova Tarefa
            </button>
          )}
          <div className="sep" />
          {session && (
            <div className="session-identity">
              <Avatar name={session.nome || session.login} size={28} />
              <span>{session.nome || session.login}</span>
            </div>
          )}
          <div className={`dropdown${dropdownOpen ? " open" : ""}`}>
            <button className="btn btn-ghost icon-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <i className="fas fa-ellipsis-v" />
            </button>
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  setReportModalOpen(true);
                }}
              >
                <i className="fas fa-file-pdf" /> Gerar Relatório
              </button>
              <button className="dropdown-item" onClick={exportarJSON}>
                <i className="fas fa-file-code" /> Exportar JSON
              </button>
              <button className="dropdown-item" onClick={exportarCSV}>
                <i className="fas fa-file-csv" /> Exportar CSV
              </button>
              {session?.nivel === "MASTER" && (
                <a className="dropdown-item" href="/cadastrarlogin">
                  <i className="fas fa-users-gear" /> Gerenciar Logins
                </a>
              )}
              <NotificacoesItem />
              <a className="dropdown-item" href="/minha-conta">
                <i className="fas fa-key" /> Alterar Senha
              </a>
              <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                <i className="fas fa-right-from-bracket" /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {view !== "reunioes" && (
        <SummaryBar
          tarefas={tarefas}
          statusFilter={statusFilter}
          onToggle={(s) => setStatusFilter((cur) => (cur === s ? null : s))}
        />
      )}

      <AniversariantesBanner />

      <div id="view-container">
        <div id="view-nav">
          <div className="view-tabs">
            <ViewTabs view={view} onSelect={setView} />
          </div>
          <div className="view-actions" />
        </div>

        <div id="visualizacao">
          {loading ? (
            <div className="empty-state">
              <p>Carregando...</p>
            </div>
          ) : view === "tabela" ? (
            <TabelaView key="tabela" list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "kanban" ? (
            <KanbanView
              list={filtered}
              onEdit={openEdit}
              onToggleArchive={handleToggleArchive}
              onDelete={setDeleteTarget}
              onDrop={handleKanbanDrop}
            />
          ) : view === "arquivadas" ? (
            <TabelaView key="arquivadas" list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "minhas" ? (
            <DashboardView list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "agenda" ? (
            <AgendaView list={filtered} onOpenDetail={openEdit} />
          ) : view === "semanal" ? (
            <AtividadesFixasView list={filtered} onOpenDetail={openEdit} />
          ) : view === "direcionar" ? (
            <DirecionarView list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "reunioes" ? (
            <ReunioesView />
          ) : (
            <ResponsaveisView list={filtered} onEdit={openEdit} />
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} />

      <TaskModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onGenerate={handleGenerateFromFixa}
        onDelete={(t) => {
          setModalOpen(false);
          setDeleteTarget(t);
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        text={`Apagar "${deleteTarget?.tarefa || "esta tarefa"}" permanentemente?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} onGenerate={gerarRelatorio} />
    </div>
  );
}
