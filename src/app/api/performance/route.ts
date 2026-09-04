import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { salvarSnapshotSemanal, CAMPOS_NUMERICOS, PostSemanalInput } from "@/lib/performanceSave";

export async function GET() {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const snapshots = await prisma.snapshotSemanal.findMany({
    include: { posts: true },
    orderBy: { inicioSemana: "desc" },
  });
  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const inicioSemana = typeof body?.inicioSemana === "string" ? body.inicioSemana : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioSemana)) {
    return NextResponse.json({ error: "Informe o início da semana (segunda-feira)." }, { status: 400 });
  }

  const campos: Record<string, number> = {};
  for (const campo of CAMPOS_NUMERICOS) {
    campos[campo] = typeof body?.[campo] === "number" ? body[campo] : 0;
  }

  const posts: PostSemanalInput[] = Array.isArray(body?.posts)
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

  const existenteAntes = await prisma.snapshotSemanal.findUnique({ where: { inicioSemana } });

  const snapshot = await salvarSnapshotSemanal({
    inicioSemana,
    origemDados: typeof body?.origemDados === "string" ? body.origemDados : "manual",
    ytCtr: typeof body?.ytCtr === "number" ? body.ytCtr : 0,
    campos,
    posts,
  });

  return NextResponse.json(snapshot, { status: existenteAntes ? 200 : 201 });
}
