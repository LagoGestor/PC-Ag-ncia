"use client";

import { useEffect, useState } from "react";
import { RESPONSAVEL_ARMAZENAR } from "@/types";
import { api } from "@/lib/api";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ReportModal } from "./ReportModal";

function fmtDate(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

export function MobileHeaderMenu() {
  const [open, setOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { toasts, toast } = useToasts();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  async function gerarRelatorio(inicio: string, fim: string) {
    const all = await api.list();
    const list = all.filter(
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      <div className={`dropdown${open ? " open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="mobile-logout-btn" onClick={() => setOpen((v) => !v)} title="Menu">
          <i className="fas fa-ellipsis-v" />
        </button>
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              setReportModalOpen(true);
            }}
          >
            <i className="fas fa-file-pdf" /> Gerar Relatório
          </button>
          <a className="dropdown-item" href="/minha-conta">
            <i className="fas fa-key" /> Alterar Senha
          </a>
          <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket" /> Sair
          </button>
        </div>
      </div>

      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} onGenerate={gerarRelatorio} />
      <ToastContainer toasts={toasts} />
    </>
  );
}
