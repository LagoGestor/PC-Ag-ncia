import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const FIELDS = [
  "tarefa",
  "area",
  "tipo",
  "responsavel",
  "descricao",
  "solicitacao",
  "feedback",
  "entrega",
  "status",
  "diaSemana",
] as const;

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (typeof body.arquivada === "boolean") data.arquivada = body.arquivada;
  if (typeof body.fixa === "boolean") data.fixa = body.fixa;

  const tarefa = await prisma.tarefa.update({ where: { id }, data });

  return NextResponse.json(tarefa);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.tarefa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
