import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";

// Leitura liberada pra qualquer sessão válida (Executor inclusive) — o aviso de aniversariantes
// aparece também na visão individual dele em /mobile/[pessoa], só sem poder editar/cadastrar.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const lista = await prisma.aniversariante.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  if (!nome) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });

  const criado = await prisma.aniversariante.create({
    data: {
      nome,
      ministerio: typeof body?.ministerio === "string" ? body.ministerio : "",
      cargo: typeof body?.cargo === "string" ? body.cargo : "",
      instagram: typeof body?.instagram === "string" ? body.instagram.replace(/^@/, "") : "",
      dia: typeof body?.dia === "number" ? body.dia : null,
      mes: typeof body?.mes === "number" ? body.mes : null,
    },
  });
  return NextResponse.json(criado, { status: 201 });
}
