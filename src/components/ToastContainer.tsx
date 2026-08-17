"use client";

import { ToastItem } from "@/hooks/useToasts";

const ICONS: Record<string, string> = {
  success: "fa-check-circle",
  error: "fa-times-circle",
  info: "fa-info-circle",
};

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fas ${ICONS[t.type]}`} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
