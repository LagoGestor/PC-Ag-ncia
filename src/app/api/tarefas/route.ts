import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite, scopeResponsavel } from "@/lib/permissions";
import { marcarAtrasadas } from "@/lib/marcarAtrasadas";

export async function GET() {
  await marcarAtrasadas();
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
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();
  // Qualquer nível cria tarefa (Executor sempre pra si mesmo, via scopeResponsavel abaixo), mas só Master/Diretor criam atividade fixa.
  const fixa = canWrite(session) && !!body.fixa;
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
      redeSocial: body.redeSocial ?? "",
      origemFixaId: body.origemFixaId ?? "",
      responsavel,
      descricao: body.descricao ?? "",
      link: body.link ?? "",
      linksExtras: body.linksExtras ?? "",
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
