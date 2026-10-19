import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWriteTarefa, canEditTarefa } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

const FIELDS = [
  "tarefa",
  "area",
  "tipo",
  "responsavel",
  "descricao",
  "link",
  "linksExtras",
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

  const body = await req.json();

  const touchesArquivada = typeof body.arquivada === "boolean";
  const touchesFixa = typeof body.fixa === "boolean";

  // Quem não é Master/Diretor (Executor, nas próprias tarefas) edita as informações da tarefa, mas não
  // arquiva, não vira/deixa de ser fixa, não muda o dia fixo e não passa a tarefa pra outra pessoa.
  const mudaAlemDoPermitido =
    (touchesArquivada && body.arquivada !== existente.arquivada) ||
    (touchesFixa && body.fixa !== existente.fixa) ||
    (body.diaSemana !== undefined && body.diaSemana !== existente.diaSemana) ||
    (body.responsavel !== undefined && body.responsavel !== existente.responsavel);

  const permitido =
    canWriteTarefa(session, existente.responsavel) || (!mudaAlemDoPermitido && canEditTarefa(session, existente.responsavel));

  if (!permitido) {
    return NextResponse.json({ error: "Você não tem permissão para editar esta tarefa." }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (touchesArquivada) data.arquivada = body.arquivada;
  if (touchesFixa) data.fixa = body.fixa;

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
