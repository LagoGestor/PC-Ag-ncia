"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Status, Tarefa, View } from "@/types";
import { ToastContainer } from "@/components/ToastContainer";
import { SummaryBar } from "@/components/SummaryBar";
import { DashboardView } from "@/components/DashboardView";
import { TabelaView } from "@/components/TabelaView";
import { KanbanView } from "@/components/KanbanView";
import { ArquivadasView } from "@/components/ArquivadasView";
import { AgendaView } from "@/components/AgendaView";
import { AtividadesFixasView } from "@/components/AtividadesFixasView";
import { ResponsaveisView } from "@/components/ResponsaveisView";
import { TaskModal } from "@/components/TaskModal";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function Home() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tarefa | null>(null);

  const { toasts, toast } = useToasts();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && view === "kanban") setView("dashboard");
  }, [isMobile, view]);

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
  }, [tarefas, view, statusFilter, searchQuery]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: Tarefa) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleSave(data: Omit<Tarefa, "id" | "arquivada" | "fixa" | "diaSemana">, id?: string) {
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

  function nextOccurrence(diaSemana: string): string {
    const map: Record<string, number> = { Domingo: 0, Segunda: 1, "Terça": 2, Quarta: 3, Quinta: 4, Sexta: 5, "Sábado": 6 };
    const target = map[diaSemana];
    const today = new Date();
    const diff = target === undefined ? 0 : (target - today.getDay() + 7) % 7;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
        status: "Ativa",
      });
      setTarefas((prev) => [created, ...prev]);
      toast(`"${t.tarefa}" adicionada à lista de tarefas!`, "success");
    } catch {
      toast("Erro ao adicionar tarefa", "error");
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

  return (
    <div id="app">
      <div id="topbar">
        <div className="brand">
          <div className="brand-icon">
            <i className="fas fa-check-double" />
          </div>
          <span className="brand-name">
            Gestor<span>.</span>
          </span>
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
          <button className="btn btn-accent" onClick={openNew}>
            <i className="fas fa-plus" /> Nova Tarefa
          </button>
          <div className="sep" />
          <div className={`dropdown${dropdownOpen ? " open" : ""}`}>
            <button className="btn btn-ghost icon-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <i className="fas fa-ellipsis-v" />
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={exportarJSON}>
                <i className="fas fa-file-code" /> Exportar JSON
              </button>
              <button className="dropdown-item" onClick={exportarCSV}>
                <i className="fas fa-file-csv" /> Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <SummaryBar
        tarefas={tarefas}
        statusFilter={statusFilter}
        onToggle={(s) => setStatusFilter((cur) => (cur === s ? null : s))}
      />

      <div id="view-container">
        <div id="view-nav">
          <div className="view-tabs">
            {isMobile ? (
              <>
                <button className={`tab-btn${view === "dashboard" ? " active" : ""}`} onClick={() => setView("dashboard")}>
                  CARDS
                </button>
                <button className={`tab-btn${view === "tabela" ? " active" : ""}`} onClick={() => setView("tabela")}>
                  LISTA
                </button>
                <button className={`tab-btn${view === "responsaveis" ? " active" : ""}`} onClick={() => setView("responsaveis")}>
                  TIME
                </button>
                <button className={`tab-btn${view === "agenda" ? " active" : ""}`} onClick={() => setView("agenda")}>
                  AGENDA
                </button>
                <button className={`tab-btn${view === "semanal" ? " active" : ""}`} onClick={() => setView("semanal")}>
                  FIXO
                </button>
                <button className={`tab-btn${view === "arquivadas" ? " active" : ""}`} onClick={() => setView("arquivadas")} title="Arquivo">
                  <i className="fas fa-box-archive" />
                </button>
              </>
            ) : (
              <>
                <button className={`tab-btn${view === "tabela" ? " active" : ""}`} onClick={() => setView("tabela")}>
                  <i className="fas fa-table" /> LISTA
                </button>
                <button className={`tab-btn${view === "dashboard" ? " active" : ""}`} onClick={() => setView("dashboard")}>
                  <i className="fas fa-th-large" /> CARDS
                </button>
                <button className={`tab-btn${view === "kanban" ? " active" : ""}`} onClick={() => setView("kanban")}>
                  <i className="fas fa-columns" /> KANBAN
                </button>
                <button className={`tab-btn${view === "agenda" ? " active" : ""}`} onClick={() => setView("agenda")}>
                  <i className="fas fa-calendar-days" /> AGENDA
                </button>
                <button className={`tab-btn${view === "semanal" ? " active" : ""}`} onClick={() => setView("semanal")}>
                  <i className="fas fa-repeat" /> ATIVIDADES DA SEMANA
                </button>
                <button className={`tab-btn${view === "arquivadas" ? " active" : ""}`} onClick={() => setView("arquivadas")}>
                  <i className="fas fa-box-archive" /> ARQUIVO
                </button>
                <button className={`tab-btn${view === "responsaveis" ? " active" : ""}`} onClick={() => setView("responsaveis")}>
                  <i className="fas fa-users" /> TIME
                </button>
              </>
            )}
          </div>
          <div className="view-actions" />
        </div>

        <div id="visualizacao">
          {loading ? (
            <div className="empty-state">
              <p>Carregando...</p>
            </div>
          ) : view === "dashboard" ? (
            <DashboardView list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "tabela" ? (
            <TabelaView list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "kanban" ? (
            <KanbanView
              list={filtered}
              onEdit={openEdit}
              onToggleArchive={handleToggleArchive}
              onDelete={setDeleteTarget}
              onDrop={handleKanbanDrop}
            />
          ) : view === "arquivadas" ? (
            <ArquivadasView list={filtered} onEdit={openEdit} onToggleArchive={handleToggleArchive} onDelete={setDeleteTarget} />
          ) : view === "agenda" ? (
            <AgendaView list={filtered} onOpenDetail={openEdit} />
          ) : view === "semanal" ? (
            <AtividadesFixasView list={filtered} onOpenDetail={openEdit} />
          ) : (
            <ResponsaveisView />
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
      />

      <ConfirmModal
        open={!!deleteTarget}
        text={`Apagar "${deleteTarget?.tarefa || "esta tarefa"}" permanentemente?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
