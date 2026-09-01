import type { Nivel } from "./auth";

export interface SessionLike {
  nivel: Nivel;
  responsavel: string;
}

export function isMaster(session: SessionLike | null): boolean {
  return session?.nivel === "MASTER";
}

// Gestão completa de tarefas: criar, editar qualquer campo, arquivar, apagar — para qualquer responsável.
// Master e Diretor de Conteúdo têm esse poder igualmente; não há mais escopo por responsável para eles.
export function canWrite(session: SessionLike | null): boolean {
  if (!session) return false;
  return session.nivel === "MASTER" || session.nivel === "DIRETOR_CONTEUDO";
}

// Responsável a que a sessão está restrita (Executor), ou null se enxerga tudo (Master/Diretor de Conteúdo).
export function scopeResponsavel(session: SessionLike | null): string | null {
  if (!session) return null;
  return session.nivel === "EXECUTOR" ? session.responsavel : null;
}

// Pode editar qualquer campo da tarefa (não só o status), arquivar ou apagar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canWriteTarefa(session: SessionLike | null, responsavelDaTarefa: string): boolean {
  return canWrite(session);
}

// Pode ao menos alterar o status da tarefa — Executor, restrito às próprias tarefas.
export function canChangeStatus(session: SessionLike | null, responsavelDaTarefa: string): boolean {
  if (canWrite(session)) return true;
  return session?.nivel === "EXECUTOR" && session.responsavel === responsavelDaTarefa;
}
