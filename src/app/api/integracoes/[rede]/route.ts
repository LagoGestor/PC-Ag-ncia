import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ rede: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { rede } = await params;
  if (rede !== "INSTAGRAM" && rede !== "YOUTUBE") {
    return NextResponse.json({ error: "Rede inválida." }, { status: 400 });
  }

  await prisma.integracaoSocial.deleteMany({ where: { rede } });
  return NextResponse.json({ ok: true });
}
