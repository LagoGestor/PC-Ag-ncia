"use client";

import { useCallback, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((msg: string, type: ToastType = "success") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2800);
  }, []);

  return { toasts, toast };
}
