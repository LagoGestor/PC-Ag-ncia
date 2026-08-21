import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
