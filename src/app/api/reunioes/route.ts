import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const reunioes = await prisma.reuniao.findMany({
    include: { assuntos: { orderBy: { createdAt: "asc" } } },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(reunioes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") {
    return NextResponse.json({ error: "Você não tem permissão para criar reuniões." }, { status: 403 });
  }

  const body = await req.json();

  if (!body.data || !body.modalidade) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const reuniao = await prisma.reuniao.create({
    data: {
      data: body.data,
      participantes: body.participantes ?? "",
      modalidade: body.modalidade,
    },
    include: { assuntos: true },
  });

  return NextResponse.json(reuniao, { status: 201 });
}
