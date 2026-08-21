import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reunioes = await prisma.reuniao.findMany({
    include: { assuntos: { orderBy: { createdAt: "asc" } } },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(reunioes);
}

export async function POST(req: NextRequest) {
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
