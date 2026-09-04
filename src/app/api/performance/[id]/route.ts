import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  await prisma.snapshotSemanal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
