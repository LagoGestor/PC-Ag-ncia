import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite, scopeResponsavel } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  const restrito = scopeResponsavel(session);

  const tarefas = await prisma.tarefa.findMany({
    where: restrito ? { responsavel: restrito } : undefined,
    orderBy: { entrega: "asc" },
  });
  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Você não tem permissão para criar tarefas." }, { status: 403 });
  }

  const body = await req.json();
  const fixa = !!body.fixa;
  const restrito = scopeResponsavel(session);
  const responsavel = restrito || body.responsavel;

  if (!body.tarefa || !body.area || !responsavel || (!fixa && (!body.solicitacao || !body.entrega))) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      tarefa: body.tarefa,
      area: body.area,
      tipo: body.tipo ?? "",
      responsavel,
      descricao: body.descricao ?? "",
      link: body.link ?? "",
      solicitacao: body.solicitacao ?? "",
      feedback: body.feedback ?? "",
      entrega: body.entrega ?? "",
      horarioPublicacao: body.horarioPublicacao ?? "",
      status: body.status ?? "Ativa",
      fixa,
      diaSemana: body.diaSemana ?? "",
    },
  });

  return NextResponse.json(tarefa, { status: 201 });
}
