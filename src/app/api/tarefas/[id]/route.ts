import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWriteTarefa } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

const FIELDS = [
  "tarefa",
  "area",
  "tipo",
  "responsavel",
  "descricao",
  "link",
  "solicitacao",
  "feedback",
  "entrega",
  "horarioPublicacao",
  "status",
  "diaSemana",
] as const;

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;

  const existente = await prisma.tarefa.findUnique({ where: { id } });
  if (!existente) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  if (!canWriteTarefa(session, existente.responsavel)) {
    return NextResponse.json({ error: "Você não tem permissão para editar esta tarefa." }, { status: 403 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  // Um "Responsável Master" só pode gerenciar as próprias tarefas — nunca transferir a tarefa para outra pessoa.
  if (session?.nivel === "RESPONSAVEL_MASTER") data.responsavel = session.responsavel;
  if (typeof body.arquivada === "boolean") data.arquivada = body.arquivada;
  if (typeof body.fixa === "boolean") data.fixa = body.fixa;

  const tarefa = await prisma.tarefa.update({ where: { id }, data });

  return NextResponse.json(tarefa);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  const { id } = await params;

  const existente = await prisma.tarefa.findUnique({ where: { id } });
  if (!existente) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  if (!canWriteTarefa(session, existente.responsavel)) {
    return NextResponse.json({ error: "Você não tem permissão para apagar esta tarefa." }, { status: 403 });
  }

  await prisma.tarefa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
