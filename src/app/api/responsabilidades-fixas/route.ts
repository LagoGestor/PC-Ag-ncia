import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const lista = await prisma.responsabilidadeFixa.findMany({ orderBy: { responsavel: "asc" } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const responsavel = typeof body?.responsavel === "string" ? body.responsavel.trim() : "";
  const atividade = typeof body?.atividade === "string" ? body.atividade.trim() : "";
  if (!responsavel || !atividade) {
    return NextResponse.json({ error: "Informe o responsável e a atividade fixa." }, { status: 400 });
  }

  const criado = await prisma.responsabilidadeFixa.create({
    data: {
      responsavel,
      atividade,
      descricao: typeof body?.descricao === "string" ? body.descricao : "",
    },
  });
  return NextResponse.json(criado, { status: 201 });
}
