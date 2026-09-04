import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { IntegracaoStatus, RedeSocial } from "@/types";

export async function GET() {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const registros = await prisma.integracaoSocial.findMany();
  const porRede = new Map(registros.map((r) => [r.rede, r]));

  const redes: RedeSocial[] = ["INSTAGRAM", "YOUTUBE"];
  const status: IntegracaoStatus[] = redes.map((rede) => {
    const r = porRede.get(rede);
    return {
      rede,
      conectado: !!r?.accessToken,
      contaNome: r?.contaNome || "",
      conectadoEm: r?.conectadoEm ? r.conectadoEm.toISOString() : null,
    };
  });

  return NextResponse.json(status);
}
