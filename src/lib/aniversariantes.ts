import type { Aniversariante } from "@/types";

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

export function ehAniversarioHoje(a: Aniversariante, hoje = new Date()): boolean {
  return a.dia === hoje.getDate() && a.mes === hoje.getMonth() + 1;
}

export function ehAniversarioNaSemana(a: Aniversariante, hoje = new Date()): boolean {
  if (!a.dia || !a.mes) return false;
  const { inicio, fim } = limitesSemanaAtual(hoje);
  return caiNoIntervalo(a.dia, a.mes, inicio, fim);
}

export function ehAniversarioNoMes(a: Aniversariante, hoje = new Date()): boolean {
  return a.mes === hoje.getMonth() + 1;
}

// Ordena por dia dentro do mês corrente primeiro, depois cronologicamente pelo resto do ano.
export function ordenarPorProximoAniversario(lista: Aniversariante[], hoje = new Date()): Aniversariante[] {
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  function chave(a: Aniversariante): number {
    if (!a.dia || !a.mes) return 9999;
    const diffMes = (a.mes - mesAtual + 12) % 12;
    return diffMes * 100 + (diffMes === 0 && a.dia < diaAtual ? a.dia + 100 : a.dia);
  }
  return [...lista].sort((a, b) => chave(a) - chave(b));
}
