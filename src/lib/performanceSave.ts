import { prisma } from "./prisma";
import { gerarDiagnostico } from "./performanceInsights";
import type { RedeSocial, SnapshotSemanal } from "@/types";

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function segundaFeiraDeHoje(): string {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = (dia + 6) % 7;
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diff);
  return `${seg.getFullYear()}-${String(seg.getMonth() + 1).padStart(2, "0")}-${String(seg.getDate()).padStart(2, "0")}`;
}

export function hojeYYYYMMDD(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

export const CAMPOS_NUMERICOS = [
  "igSeguidores",
  "igSeguidoresGanhos",
  "igContasAlcancadas",
  "igImpressoes",
  "igVisualizacoes",
  "igCurtidas",
  "igComentarios",
  "igCompartilhamentos",
  "igSalvamentos",
  "igStoriesPublicados",
  "igStoriesAlcance",
  "igStoriesImpressoes",
  "igStoriesRespostas",
  "igStoriesSaidas",
  "igStoriesAvancos",
  "igStoriesVoltas",
  "ytInscritos",
  "ytInscritosGanhos",
  "ytVisualizacoes",
  "ytImpressoes",
  "ytTempoExibicaoMin",
  "ytDuracaoMediaSeg",
] as const;

export interface PostSemanalInput {
  rede: RedeSocial;
  tipo: string;
  titulo: string;
  link: string;
  publicadoEm: string;
  alcance: number;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvamentos: number;
  taxaEngajamento: number;
}

// Faz o upsert de uma semana: calcula fimSemana, busca a semana anterior para comparar,
// gera diagnóstico/recomendações e grava a semana + os posts — usado tanto pelo lançamento
// manual quanto pela busca automática via API, para nunca duplicar essa lógica.
export async function salvarSnapshotSemanal(input: {
  inicioSemana: string;
  origemDados: string;
  ytCtr: number;
  campos: Partial<Record<(typeof CAMPOS_NUMERICOS)[number], number>>;
  posts: PostSemanalInput[];
}) {
  const data: Record<string, unknown> = {
    inicioSemana: input.inicioSemana,
    fimSemana: addDays(input.inicioSemana, 6),
    origemDados: input.origemDados,
    ytCtr: input.ytCtr,
  };
  for (const campo of CAMPOS_NUMERICOS) {
    data[campo] = input.campos[campo] ?? 0;
  }

  const anteriorRaw = await prisma.snapshotSemanal.findUnique({
    where: { inicioSemana: addDays(input.inicioSemana, -7) },
    include: { posts: true },
  });

  const atualParaDiagnostico = { ...data, posts: input.posts } as unknown as SnapshotSemanal;
  const { diagnostico, recomendacoes } = gerarDiagnostico(atualParaDiagnostico, anteriorRaw as unknown as SnapshotSemanal | null);
  data.diagnostico = diagnostico;
  data.recomendacoes = recomendacoes;

  const existente = await prisma.snapshotSemanal.findUnique({ where: { inicioSemana: input.inicioSemana } });

  return prisma.$transaction(async (tx) => {
    const saved = existente
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await tx.snapshotSemanal.update({ where: { inicioSemana: input.inicioSemana }, data: data as any })
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await tx.snapshotSemanal.create({ data: data as any });

    await tx.postSemanal.deleteMany({ where: { snapshotId: saved.id } });
    if (input.posts.length > 0) {
      await tx.postSemanal.createMany({ data: input.posts.map((p) => ({ ...p, snapshotId: saved.id })) });
    }

    return tx.snapshotSemanal.findUniqueOrThrow({ where: { id: saved.id }, include: { posts: true } });
  });
}
