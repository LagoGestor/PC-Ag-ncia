import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "Você não pode apagar o seu próprio login." }, { status: 400 });
  }

  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
