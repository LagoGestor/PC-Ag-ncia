import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { exchangeYoutubeCode } from "@/lib/redesSociais/youtube";

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
    const conexao = await exchangeYoutubeCode(code);
    if (!conexao.refreshToken) {
      url.searchParams.set(
        "erro",
        "O Google não retornou um refresh token (provavelmente já havia uma autorização anterior). Revogue o acesso em myaccount.google.com/permissions e tente conectar de novo."
      );
      return NextResponse.redirect(url);
    }
    await prisma.integracaoSocial.upsert({
      where: { rede: "YOUTUBE" },
      create: {
        rede: "YOUTUBE",
        accessToken: conexao.accessToken,
        refreshToken: conexao.refreshToken,
        expiraEm: conexao.expiraEm,
        contaId: conexao.contaId,
        contaNome: conexao.contaNome,
        conectadoPor: session.login,
      },
      update: {
        accessToken: conexao.accessToken,
        refreshToken: conexao.refreshToken,
        expiraEm: conexao.expiraEm,
        contaId: conexao.contaId,
        contaNome: conexao.contaNome,
        conectadoPor: session.login,
      },
    });
    url.searchParams.set("conectado", "youtube");
  } catch (err) {
    url.searchParams.set("erro", err instanceof Error ? err.message : "Erro ao conectar o YouTube.");
  }

  return NextResponse.redirect(url);
}
