import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInstagramAuthorizeUrl, instagramConfigurado } from "@/lib/redesSociais/instagram";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  if (!instagramConfigurado()) {
    const url = new URL("/integracoes-sociais", req.url);
    url.searchParams.set("erro", "Instagram não configurado. Defina META_APP_ID e META_APP_SECRET.");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(getInstagramAuthorizeUrl());
}
