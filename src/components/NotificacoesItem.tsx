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
    try {
      const reg = await navigator.serviceWorker.ready;
      const atual = await reg.pushManager.getSubscription();
      if (atual) {
        await fetch("/api/push/inscrever", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: atual.endpoint }),
        });
        await atual.unsubscribe();
        setAtivo(false);
        return;
      }
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setBloqueado(permissao === "denied");
        return;
      }
      const { publicKey } = await fetch("/api/push/chave").then((r) => r.json());
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const res = await fetch("/api/push/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setAtivo(res.ok);
    } catch {
      // Sem permissão/sem suporte: o item continua como estava.
    } finally {
      setOcupado(false);
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
    </>
  );
}
