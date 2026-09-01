"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Nivel } from "@/lib/auth";

export interface ClientSession {
  nome: string;
  login: string;
  nivel: Nivel;
  responsavel: string;
}

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({ session, children }: { session: ClientSession | null; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession | null {
  return useContext(SessionContext);
}
