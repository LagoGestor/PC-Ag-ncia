import type { Aniversariante } from "@/types";

export const CARGOS_PASTORAIS = ["Pastor", "Pastora", "Pastor Regional"];

export function ehCargoPastoral(cargo: string): boolean {
  return CARGOS_PASTORAIS.includes(cargo.trim());
}

// Quantos dias faltam (0 = hoje) até a próxima ocorrência desse dia/mês, olhando este ano e,
// se já passou, o próximo — o aniversário em si não tem ano.
export function diasAteProximoAniversario(dia: number, mes: number, hoje = new Date()): number {
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  for (const ano of [hojeSemHora.getFullYear(), hojeSemHora.getFullYear() + 1]) {
    const candidato = new Date(ano, mes - 1, dia);
    const diff = Math.round((candidato.getTime() - hojeSemHora.getTime()) / 86400000);
    if (diff >= 0) return diff;
  }
  return Infinity;
}

export function ehAniversarioHoje(a: Aniversariante, hoje = new Date()): boolean {
  return a.dia === hoje.getDate() && a.mes === hoje.getMonth() + 1;
}

// Segunda-feira e domingo da semana corrente, à meia-noite local.
export function limitesSemanaAtual(hoje = new Date()): { inicio: Date; fim: Date } {
  const dia = hoje.getDay();
  const diffSegunda = (dia + 6) % 7;
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diffSegunda);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59, 999);
  return { inicio, fim };
}

// Testa se o dia/mês (recorrente, sem ano) cai dentro do intervalo [inicio, fim] em QUALQUER ano —
// necessário porque a semana pode virar o ano (ex.: 29/12 a 04/01).
function caiNoIntervalo(dia: number, mes: number, inicio: Date, fim: Date): boolean {
  for (const ano of [inicio.getFullYear(), inicio.getFullYear() + 1, inicio.getFullYear() - 1]) {
    const candidato = new Date(ano, mes - 1, dia);
    if (candidato >= inicio && candidato <= fim) return true;
  }
  return false;
}

export function ehAniversarioNaSemana(a: Aniversariante, hoje = new Date()): boolean {
  if (!a.dia || !a.mes) return false;
  const { inicio, fim } = limitesSemanaAtual(hoje);
  return caiNoIntervalo(a.dia, a.mes, inicio, fim);
}

export function ehAniversarioNosProximosDias(a: Aniversariante, dias: number, hoje = new Date()): boolean {
  if (!a.dia || !a.mes) return false;
  return diasAteProximoAniversario(a.dia, a.mes, hoje) <= dias;
}

// Ordena por proximidade real (em dias) do próximo aniversário; sem data conhecida vai para o fim.
export function ordenarPorProximoAniversario(lista: Aniversariante[], hoje = new Date()): Aniversariante[] {
  function chave(a: Aniversariante): number {
    if (!a.dia || !a.mes) return Infinity;
    return diasAteProximoAniversario(a.dia, a.mes, hoje);
  }
  return [...lista].sort((a, b) => chave(a) - chave(b));
}
