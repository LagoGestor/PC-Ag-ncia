import type { Nivel } from "./auth";

export interface SessionLike {
  nivel: Nivel;
  responsavel: string;
}

export function canWrite(session: SessionLike | null): boolean {
  if (!session) return false;
  return session.nivel === "MASTER" || session.nivel === "RESPONSAVEL_MASTER";
}

export function isMaster(session: SessionLike | null): boolean {
  return session?.nivel === "MASTER";
}

export function isMasterLevel(session: SessionLike | null): boolean {
  return session?.nivel === "MASTER" || session?.nivel === "MASTER_LEITURA";
}

// Responsável a que a sessão está restrita, ou null se ela enxerga tudo (níveis Master).
export function scopeResponsavel(session: SessionLike | null): string | null {
  if (!session) return null;
  return session.nivel === "RESPONSAVEL_MASTER" || session.nivel === "RESPONSAVEL_LEITURA"
    ? session.responsavel
    : null;
}

export function canWriteTarefa(session: SessionLike | null, responsavelDaTarefa: string): boolean {
  if (!session) return false;
  if (session.nivel === "MASTER") return true;
  if (session.nivel === "RESPONSAVEL_MASTER") return responsavelDaTarefa === session.responsavel;
  return false;
}
