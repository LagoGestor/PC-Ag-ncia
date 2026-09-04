"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IntegracaoStatus } from "@/types";
import { useToasts } from "@/hooks/useToasts";
import { ToastContainer } from "./ToastContainer";
import { ConfirmModal } from "./ConfirmModal";

const REDE_LABEL: Record<string, string> = { INSTAGRAM: "Instagram", YOUTUBE: "YouTube" };
const REDE_ICON: Record<string, string> = { INSTAGRAM: "fa-instagram", YOUTUBE: "fa-youtube" };

export function IntegracoesSociaisClient() {
  const [status, setStatus] = useState<IntegracaoStatus[] | null>(null);
  const [desconectarAlvo, setDesconectarAlvo] = useState<string | null>(null);
  const { toasts, toast } = useToasts();

  function carregar() {
    fetch("/api/integracoes")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => toast("Erro ao carregar integrações", "error"));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conectado = params.get("conectado");
    const erro = params.get("erro");
    if (conectado) toast(`${REDE_LABEL[conectado.toUpperCase()] || conectado} conectado com sucesso!`, "success");
    if (erro) toast(erro, "error");
    if (conectado || erro) window.history.replaceState({}, "", "/integracoes-sociais");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDesconectar() {
    if (!desconectarAlvo) return;
    try {
      await fetch(`/api/integracoes/${desconectarAlvo}`, { method: "DELETE" });
      toast("Conta desconectada", "info");
      carregar();
    } catch {
      toast("Erro ao desconectar", "error");
    } finally {
      setDesconectarAlvo(null);
    }
  }

  return (
    <div className="cadastrar-login-shell">
      <h1 className="fixas-title">Integrações Sociais</h1>
      <p className="fixas-subtitle">
        Conecte o Instagram e o YouTube da Agência para a página de Performance buscar os dados automaticamente. Restrito a
        contas Master.
      </p>

      <div className="cadastrar-login-list" style={{ marginTop: 20 }}>
        {status === null ? (
          <p className="mobile-empty">Carregando...</p>
        ) : (
          status.map((s) => (
            <div key={s.rede} className="cadastrar-login-row">
              <div className="cadastrar-login-row-avatar">
                <i className={`fab ${REDE_ICON[s.rede]}`} />
              </div>
              <div className="cadastrar-login-row-info">
                <div className="cadastrar-login-row-login">{REDE_LABEL[s.rede]}</div>
                <div className="cadastrar-login-row-meta">
                  {s.conectado ? `Conectado como ${s.contaNome || "conta sem nome"}` : "Não conectado"}
                </div>
              </div>
              <div className="cadastrar-login-row-actions">
                {s.conectado ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setDesconectarAlvo(s.rede)}>
                    Desconectar
                  </button>
                ) : (
                  <a className="btn btn-accent btn-sm" href={`/api/integracoes/${s.rede.toLowerCase()}/connect`}>
                    Conectar
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/" className="btn btn-ghost" style={{ marginTop: 24 }}>
        Voltar
      </Link>

      <ConfirmModal
        open={!!desconectarAlvo}
        title="Desconectar conta?"
        text="A busca automática de dados dessa rede vai parar de funcionar até conectar de novo."
        onCancel={() => setDesconectarAlvo(null)}
        onConfirm={handleDesconectar}
      />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
