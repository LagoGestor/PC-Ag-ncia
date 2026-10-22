import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { RESPONSAVEL_ARMAZENAR } from "@/types";

// Tudo que vai ao ar no Instagram, de todos os responsáveis — pra qualquer nível saber o que entra na semana.
// Devolve só o necessário pra ver (sem responsável, descrição, links...), por isso é seguro pro Executor.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const posts = await prisma.tarefa.findMany({
    where: { redeSocial: "Instagram", arquivada: false, fixa: false, responsavel: { not: RESPONSAVEL_ARMAZENAR } },
    select: { id: true, tarefa: true, tipo: true, entrega: true, horarioPublicacao: true, status: true },
    orderBy: { entrega: "asc" },
  });
  return NextResponse.json(posts);
}
