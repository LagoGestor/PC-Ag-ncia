import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { gerarDiagnostico } from "@/lib/performanceInsights";
import type { SnapshotSemanal } from "@/types";

function podeVer(session: Awaited<ReturnType<typeof getSession>>) {
  return canWrite(session);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const session = await getSession();
  if (!podeVer(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const snapshots = await prisma.snapshotSemanal.findMany({
    include: { posts: true },
    orderBy: { inicioSemana: "desc" },
  });
  return NextResponse.json(snapshots);
}

const NUM_FIELDS = [
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!podeVer(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const inicioSemana = typeof body?.inicioSemana === "string" ? body.inicioSemana : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioSemana)) {
    return NextResponse.json({ error: "Informe o início da semana (segunda-feira)." }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    inicioSemana,
    fimSemana: addDays(inicioSemana, 6),
    origemDados: typeof body?.origemDados === "string" ? body.origemDados : "manual",
    ytCtr: typeof body?.ytCtr === "number" ? body.ytCtr : 0,
  };
  for (const field of NUM_FIELDS) {
    data[field] = typeof body?.[field] === "number" ? body[field] : 0;
  }

  const posts = Array.isArray(body?.posts)
    ? body.posts.map((p: Record<string, unknown>) => ({
        rede: p.rede === "YOUTUBE" ? "YOUTUBE" : "INSTAGRAM",
        tipo: typeof p.tipo === "string" ? p.tipo : "",
        titulo: typeof p.titulo === "string" ? p.titulo : "",
        link: typeof p.link === "string" ? p.link : "",
        publicadoEm: typeof p.publicadoEm === "string" ? p.publicadoEm : "",
        alcance: typeof p.alcance === "number" ? p.alcance : 0,
        visualizacoes: typeof p.visualizacoes === "number" ? p.visualizacoes : 0,
        curtidas: typeof p.curtidas === "number" ? p.curtidas : 0,
        comentarios: typeof p.comentarios === "number" ? p.comentarios : 0,
        compartilhamentos: typeof p.compartilhamentos === "number" ? p.compartilhamentos : 0,
        salvamentos: typeof p.salvamentos === "number" ? p.salvamentos : 0,
        taxaEngajamento: typeof p.taxaEngajamento === "number" ? p.taxaEngajamento : 0,
      }))
    : [];

  const anteriorRaw = await prisma.snapshotSemanal.findUnique({
    where: { inicioSemana: addDays(inicioSemana, -7) },
    include: { posts: true },
  });

  const atualParaDiagnostico = { ...data, posts } as unknown as SnapshotSemanal;
  const { diagnostico, recomendacoes } = gerarDiagnostico(atualParaDiagnostico, anteriorRaw as unknown as SnapshotSemanal | null);
  data.diagnostico = diagnostico;
  data.recomendacoes = recomendacoes;

  const existente = await prisma.snapshotSemanal.findUnique({ where: { inicioSemana } });

  const snapshot = await prisma.$transaction(async (tx) => {
    const saved = existente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await tx.snapshotSemanal.update({ where: { inicioSemana }, data: data as any })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : await tx.snapshotSemanal.create({ data: data as any });

    await tx.postSemanal.deleteMany({ where: { snapshotId: saved.id } });
    if (posts.length > 0) {
      await tx.postSemanal.createMany({ data: posts.map((p: object) => ({ ...p, snapshotId: saved.id })) });
    }

    return tx.snapshotSemanal.findUniqueOrThrow({ where: { id: saved.id }, include: { posts: true } });
  });

  return NextResponse.json(snapshot, { status: existente ? 200 : 201 });
}
