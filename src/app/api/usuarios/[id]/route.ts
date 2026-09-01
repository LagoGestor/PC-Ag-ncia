import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { RESPONSAVEIS_VISIVEIS } from "@/types";

const NIVEIS = ["MASTER", "DIRETOR_CONTEUDO", "EXECUTOR"] as const;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  const alvo = await prisma.usuario.findUnique({ where: { id } });
  if (!alvo) return NextResponse.json({ error: "Login não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";
  const nivel = body?.nivel;
  const responsavel = typeof body?.responsavel === "string" ? body.responsavel : "";

  if (!nome || !login || !NIVEIS.includes(nivel)) {
    return NextResponse.json({ error: "Preencha nome, login e nível válidos." }, { status: 400 });
  }
  if (senha && senha.length < 4) {
    return NextResponse.json({ error: "A senha deve ter ao menos 4 caracteres." }, { status: 400 });
  }
  const isExecutor = nivel === "EXECUTOR";
  if (isExecutor && !RESPONSAVEIS_VISIVEIS.includes(responsavel)) {
    return NextResponse.json({ error: "Selecione um responsável válido para esse nível." }, { status: 400 });
  }

  if (alvo.nivel === "MASTER" && nivel !== "MASTER") {
    const outrosMasters = await prisma.usuario.count({ where: { nivel: "MASTER", id: { not: id } } });
    if (outrosMasters === 0) {
      return NextResponse.json({ error: "Precisa existir pelo menos um Master no sistema." }, { status: 400 });
    }
  }

  const outroComEsseLogin = await prisma.usuario.findUnique({ where: { login } });
  if (outroComEsseLogin && outroComEsseLogin.id !== id) {
    return NextResponse.json({ error: "Já existe um login com esse nome." }, { status: 409 });
  }

  const data: Record<string, unknown> = { nome, login, nivel, responsavel: isExecutor ? responsavel : "" };
  if (senha) data.senhaHash = await hashPassword(senha);

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nome: true, login: true, nivel: true, responsavel: true, createdAt: true },
  });

  const res = NextResponse.json(usuario);

  // Se o Master editou o próprio login, atualiza a sessão dele também para não deslogar sem querer.
  if (id === session.sub) {
    const token = await signSession({
      sub: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      nivel: usuario.nivel,
      responsavel: usuario.responsavel,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return res;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "Você não pode apagar o seu próprio login." }, { status: 400 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id } });
  if (!alvo) return NextResponse.json({ error: "Login não encontrado." }, { status: 404 });

  if (alvo.nivel === "MASTER") {
    const outrosMasters = await prisma.usuario.count({ where: { nivel: "MASTER", id: { not: id } } });
    if (outrosMasters === 0) {
      return NextResponse.json({ error: "Precisa existir pelo menos um Master no sistema." }, { status: 400 });
    }
  }

  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
