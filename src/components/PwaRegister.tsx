"use client";

import { useEffect } from "react";
import { InstallPromptEvent, setInstallPrompt } from "@/lib/pwa";
import { useSession } from "./SessionProvider";

// Registra o service worker (necessário pro app instalável e pras notificações) e guarda o convite de instalação.
export function PwaRegister() {
  const session = useSession();
  const logado = !!session;

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Se este aparelho já tem notificações ativadas, garante que o servidor o associa a quem está logado agora
  // (quem trocou de login no mesmo aparelho continuaria recebendo os avisos do login anterior).
  useEffect(() => {
    if (!logado || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!sub) return;
        return fetch("/api/push/inscrever?silencioso=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      })
      .catch(() => {});
  }, [logado]);

  return null;
}
