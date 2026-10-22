"use client";

import { useEffect, useState } from "react";
import { getInstallPrompt, setInstallPrompt, urlBase64ToUint8Array } from "@/lib/pwa";

// Itens do menu (⋮): ativar/desativar notificações neste aparelho e instalar o app.
export function NotificacoesItem() {
  const [suportado, setSuportado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [podeInstalar, setPodeInstalar] = useState(false);
  const [ios, setIos] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState("");

  useEffect(() => {
    // Lê o navegador depois da primeira renderização (no servidor não existe `navigator`).
    const iniciar = setTimeout(() => {
      const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setSuportado(ok);
      setIos(/iPhone|iPad|iPod/.test(navigator.userAgent));
      setBloqueado(ok && Notification.permission === "denied");
      setPodeInstalar(!!getInstallPrompt());
      if (ok) {
        navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((s) => setAtivo(!!s)).catch(() => {});
      }
    }, 0);
    const sync = () => setPodeInstalar(!!getInstallPrompt());
    window.addEventListener("pwa-install-change", sync);
    return () => {
      clearTimeout(iniciar);
      window.removeEventListener("pwa-install-change", sync);
    };
  }, []);

  async function alternar() {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    let etapa = "service worker";
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("não ficou pronto em 8s — recarregue a página")), 8000)),
      ]);
      const atual = await reg.pushManager.getSubscription();
      if (atual) {
        etapa = "desativar";
        await fetch("/api/push/inscrever", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: atual.endpoint }),
        });
        await atual.unsubscribe();
        setAtivo(false);
        return;
      }
      etapa = "permissão";
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setBloqueado(permissao === "denied");
        if (permissao !== "denied") throw new Error("permissão não concedida");
        return;
      }
      etapa = "chave do servidor";
      const chaveRes = await fetch("/api/push/chave");
      if (!chaveRes.ok) throw new Error(`HTTP ${chaveRes.status}`);
      const { publicKey } = await chaveRes.json();
      etapa = "inscrição no navegador";
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      etapa = "salvar no servidor";
      const res = await fetch("/api/push/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAtivo(true);
    } catch (e) {
      setErro(`Falhou em "${etapa}": ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function testar() {
    setErro("");
    setResultado("Enviando…");
    try {
      const r = await fetch("/api/push/teste", { method: "POST" }).then((x) => x.json());
      setResultado(
        r.aparelhos === 0
          ? `Nenhum aparelho cadastrado para o login ${r.login}. Desative e ative de novo aqui.`
          : r.enviados > 0
            ? `Enviado para ${r.enviados} aparelho(s) do login ${r.login}.`
            : `Falhou: ${r.erros?.[0] ?? "sem detalhes"}`
      );
    } catch {
      setResultado("Não consegui falar com o servidor.");
    }
  }

  async function instalar() {
    const e = getInstallPrompt();
    if (!e) return;
    await e.prompt();
    setInstallPrompt(null);
  }

  return (
    <>
      {podeInstalar && (
        <button className="dropdown-item" onClick={instalar}>
          <i className="fas fa-mobile-screen-button" /> Instalar aplicativo
        </button>
      )}
      {suportado ? (
        <button className="dropdown-item" onClick={alternar} disabled={bloqueado || ocupado}>
          <i className={`fas ${ativo ? "fa-bell-slash" : "fa-bell"}`} />{" "}
          {bloqueado ? "Notificações bloqueadas no navegador" : ativo ? "Desativar notificações" : "Ativar notificações"}
        </button>
      ) : (
        ios && (
          <span className="dropdown-item" style={{ cursor: "default", whiteSpace: "normal", fontSize: 12 }}>
            <i className="fas fa-bell" /> iPhone: toque em Compartilhar → &quot;Adicionar à Tela de Início&quot; e abra o app por lá para ativar notificações.
          </span>
        )
      )}
      {ativo && (
        <button className="dropdown-item" onClick={testar}>
          <i className="fas fa-paper-plane" /> Testar notificação
        </button>
      )}
      {resultado && (
        <span className="dropdown-item" style={{ cursor: "default", whiteSpace: "normal", fontSize: 11 }}>
          {resultado}
        </span>
      )}
      {erro && (
        <span className="dropdown-item" style={{ cursor: "default", whiteSpace: "normal", fontSize: 11, color: "var(--danger)" }}>
          {erro}
        </span>
      )}
    </>
  );
}
