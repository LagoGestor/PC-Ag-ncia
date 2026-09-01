import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { RESPONSAVEIS_VISIVEIS } from "@/types";

const NIVEIS = ["MASTER", "MASTER_LEITURA", "RESPONSAVEL_MASTER", "RESPONSAVEL_LEITURA"] as const;

export async function GET() {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, login: true, nivel: true, responsavel: true, createdAt: true },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";
  const nivel = body?.nivel;
  const responsavel = typeof body?.responsavel === "string" ? body.responsavel : "";

  if (!login || !senha || !NIVEIS.includes(nivel)) {
    return NextResponse.json({ error: "Preencha login, senha e nível válidos." }, { status: 400 });
  }
  if (senha.length < 4) {
    return NextResponse.json({ error: "A senha deve ter ao menos 4 caracteres." }, { status: 400 });
  }
  const isResponsavelScoped = nivel === "RESPONSAVEL_MASTER" || nivel === "RESPONSAVEL_LEITURA";
  if (isResponsavelScoped && !RESPONSAVEIS_VISIVEIS.includes(responsavel)) {
    return NextResponse.json({ error: "Selecione um responsável válido para esse nível." }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { login } });
  if (existente) {
    return NextResponse.json({ error: "Já existe um login com esse nome." }, { status: 409 });
  }

  const senhaHash = await hashPassword(senha);
  const usuario = await prisma.usuario.create({
    data: { login, senhaHash, nivel, responsavel: isResponsavelScoped ? responsavel : "" },
    select: { id: true, login: true, nivel: true, responsavel: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
