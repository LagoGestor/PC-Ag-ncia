import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getYoutubeAuthorizeUrl, youtubeConfigurado } from "@/lib/redesSociais/youtube";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.nivel !== "MASTER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  if (!youtubeConfigurado()) {
    const url = new URL("/integracoes-sociais", req.url);
    url.searchParams.set("erro", "YouTube não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(getYoutubeAuthorizeUrl());
}
