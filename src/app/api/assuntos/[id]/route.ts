import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const FIELDS = ["tema", "descricao", "encaminhamento", "responsavel"] as const;

async function requireMaster() {
  const session = await getSession();
  if (session?.nivel !== "MASTER") {
    return NextResponse.json({ error: "Você não tem permissão para alterar assuntos." }, { status: 403 });
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const denied = await requireMaster();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const assunto = await prisma.assunto.update({ where: { id }, data });

  return NextResponse.json(assunto);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireMaster();
  if (denied) return denied;

  const { id } = await params;
  await prisma.assunto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
