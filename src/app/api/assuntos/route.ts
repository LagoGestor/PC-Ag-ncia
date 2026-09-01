import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") {
    return NextResponse.json({ error: "Você não tem permissão para criar assuntos." }, { status: 403 });
  }

  const body = await req.json();

  if (!body.reuniaoId || !body.tema) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const assunto = await prisma.assunto.create({
    data: {
      reuniaoId: body.reuniaoId,
      tema: body.tema,
      descricao: body.descricao ?? "",
      encaminhamento: body.encaminhamento ?? "",
      responsavel: body.responsavel ?? "",
    },
  });

  return NextResponse.json(assunto, { status: 201 });
}
