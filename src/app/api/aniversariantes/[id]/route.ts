import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  if (!nome) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });

  const atualizado = await prisma.aniversariante.update({
    where: { id },
    data: {
      nome,
      ministerio: typeof body?.ministerio === "string" ? body.ministerio : "",
      cargo: typeof body?.cargo === "string" ? body.cargo : "",
      instagram: typeof body?.instagram === "string" ? body.instagram.replace(/^@/, "") : "",
      dia: typeof body?.dia === "number" ? body.dia : null,
      mes: typeof body?.mes === "number" ? body.mes : null,
    },
  });
  return NextResponse.json(atualizado);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  await prisma.aniversariante.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
