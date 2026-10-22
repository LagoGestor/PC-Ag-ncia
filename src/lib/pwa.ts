// Evento do navegador que permite abrir o "Instalar app" quando a gente quiser (Chrome/Edge/Android).
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;

export function setInstallPrompt(e: InstallPromptEvent | null) {
  deferred = e;
  window.dispatchEvent(new Event("pwa-install-change"));
}
export const getInstallPrompt = () => deferred;

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
