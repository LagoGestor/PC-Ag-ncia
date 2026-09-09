"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RESPONSAVEL_ARMAZENAR, Tarefa } from "@/types";
import { api } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { useSession } from "./SessionProvider";
import { canWrite } from "@/lib/permissions";
import { Avatar } from "./Avatar";
import { ToastContainer } from "./ToastContainer";
import { TaskModal } from "./TaskModal";
import { ReportModal } from "./ReportModal";
import { fmtDate } from "./TaskCard";

// Topbar padrão do app (igual à "/"), pra páginas fora da SPA principal (ex.: Aniversariantes)
// que ainda assim devem parecer parte da mesma ferramenta pra Master/Diretor. Autossuficiente:
// busca as próprias tarefas só pra alimentar Nova Tarefa / Gerar Relatório / Exportar.
export function AppTopbar() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toasts, toast } = useToasts();
  const session = useSession();
  const writable = canWrite(session);

  useEffect(() => {
    api.list().then(setTarefas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  async function handleCreate(data: Omit<Tarefa, "id" | "arquivada" | "fixa" | "diaSemana">) {
    try {
      const created = await api.create(data);
      setTarefas((prev) => [created, ...prev]);
      toast("Tarefa criada!", "success");
      setModalOpen(false);
    } catch {
      toast("Erro ao salvar tarefa", "error");
    }
  }

  async function gerarRelatorio(inicio: string, fim: string) {
    const list = tarefas.filter(
      (t) => !t.arquivada && !t.fixa && t.responsavel !== RESPONSAVEL_ARMAZENAR && t.entrega && t.entrega >= inicio && t.entrega <= fim
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
    <div id="topbar">
      <Link href="/" className="brand">
        <div className="brand-icon">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/icone_logo_agencia.png" alt="Agência LBC" />
        </div>
        <span className="brand-name">Agência LBC</span>
      </Link>

      <div className="top-actions">
        {writable && (
          <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="fas fa-plus" /> Nova Tarefa
          </button>
        )}
        <div className="sep" />
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
            <a className="dropdown-item" href="/minha-conta">
              <i className="fas fa-key" /> Alterar Senha
            </a>
            <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
              <i className="fas fa-right-from-bracket" /> Sair
            </button>
          </div>
        </div>
        {session && (
          <div className="session-identity">
            <Avatar name={session.nome || session.login} size={28} />
            <span>{session.nome || session.login}</span>
          </div>
        )}
      </div>

      <TaskModal open={modalOpen} editing={null} onClose={() => setModalOpen(false)} onSave={(data) => handleCreate(data)} onGenerate={() => {}} />
      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} onGenerate={gerarRelatorio} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
