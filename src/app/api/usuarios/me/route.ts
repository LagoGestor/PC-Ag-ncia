import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { confirmarSenhaGravada } from "@/lib/usuarioWrites";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { id: true, nome: true, login: true, nivel: true, responsavel: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  return NextResponse.json(usuario);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (!nome || !login) {
    return NextResponse.json({ error: "Preencha nome e login." }, { status: 400 });
  }
  if (senha && senha.length < 4) {
    return NextResponse.json({ error: "A senha deve ter ao menos 4 caracteres." }, { status: 400 });
  }

  const outroComEsseLogin = await prisma.usuario.findUnique({ where: { login } });
  if (outroComEsseLogin && outroComEsseLogin.id !== session.sub) {
    return NextResponse.json({ error: "Já existe um login com esse nome." }, { status: 409 });
  }

  const novaSenhaHash = senha ? await hashPassword(senha) : null;
  const data: Record<string, unknown> = { nome, login };
  if (novaSenhaHash) data.senhaHash = novaSenhaHash;

  const usuario = await prisma.usuario.update({
    where: { id: session.sub },
    data,
    select: { id: true, nome: true, login: true, nivel: true, responsavel: true },
  });
  if (novaSenhaHash) await confirmarSenhaGravada(session.sub, novaSenhaHash);

  const token = await signSession({
    sub: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    nivel: usuario.nivel,
    responsavel: usuario.responsavel,
  });

  const res = NextResponse.json(usuario);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
