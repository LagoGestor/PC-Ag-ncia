import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (!login || !senha) {
    return NextResponse.json({ error: "Informe login e senha." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { login } });
  if (!usuario || !(await verifyPassword(senha, usuario.senhaHash))) {
    return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 });
  }

  const token = await signSession({
    sub: usuario.id,
    login: usuario.login,
    nivel: usuario.nivel,
    responsavel: usuario.responsavel,
  });

  const res = NextResponse.json({ ok: true, nivel: usuario.nivel, responsavel: usuario.responsavel });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
