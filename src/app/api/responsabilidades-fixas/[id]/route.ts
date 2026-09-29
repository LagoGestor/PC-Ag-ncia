import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const responsavel = typeof body?.responsavel === "string" ? body.responsavel.trim() : "";
  const atividade = typeof body?.atividade === "string" ? body.atividade.trim() : "";
  if (!responsavel || !atividade) {
    return NextResponse.json({ error: "Informe o responsável e a atividade fixa." }, { status: 400 });
  }

  const atualizado = await prisma.responsabilidadeFixa.update({
    where: { id },
    data: {
      responsavel,
      atividade,
      descricao: typeof body?.descricao === "string" ? body.descricao : "",
    },
  });
  return NextResponse.json(atualizado);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  await prisma.responsabilidadeFixa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
