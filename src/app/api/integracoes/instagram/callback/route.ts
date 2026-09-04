import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { exchangeInstagramCode } from "@/lib/redesSociais/instagram";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const url = new URL("/integracoes-sociais", req.url);

  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const code = req.nextUrl.searchParams.get("code");
  const erroOAuth = req.nextUrl.searchParams.get("error_description") || req.nextUrl.searchParams.get("error");
  if (erroOAuth) {
    url.searchParams.set("erro", erroOAuth);
    return NextResponse.redirect(url);
  }
  if (!code) {
    url.searchParams.set("erro", "Código de autorização ausente.");
    return NextResponse.redirect(url);
  }

  try {
    const conexao = await exchangeInstagramCode(code);
    await prisma.integracaoSocial.upsert({
      where: { rede: "INSTAGRAM" },
      create: {
        rede: "INSTAGRAM",
        accessToken: conexao.accessToken,
        contaId: conexao.contaId,
        contaNome: conexao.contaNome,
        conectadoPor: session.login,
      },
      update: {
        accessToken: conexao.accessToken,
        contaId: conexao.contaId,
        contaNome: conexao.contaNome,
        conectadoPor: session.login,
      },
    });
    url.searchParams.set("conectado", "instagram");
  } catch (err) {
    url.searchParams.set("erro", err instanceof Error ? err.message : "Erro ao conectar o Instagram.");
  }

  return NextResponse.redirect(url);
}
