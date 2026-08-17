import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tarefas = await prisma.tarefa.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fixa = !!body.fixa;

  if (!body.tarefa || !body.area || !body.responsavel || (!fixa && (!body.solicitacao || !body.entrega))) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      tarefa: body.tarefa,
      area: body.area,
      tipo: body.tipo ?? "",
      responsavel: body.responsavel,
      descricao: body.descricao ?? "",
      solicitacao: body.solicitacao ?? "",
      feedback: body.feedback ?? "",
      entrega: body.entrega ?? "",
      status: body.status ?? "Ativa",
      fixa,
      diaSemana: body.diaSemana ?? "",
    },
  });

  return NextResponse.json(tarefa, { status: 201 });
}
