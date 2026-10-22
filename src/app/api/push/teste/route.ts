import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { enviarPush } from "@/lib/push";

// "Testar notificação" do menu: manda pros aparelhos do login que está logado e diz quantos achou.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const r = await enviarPush([session.sub], { title: "Agência LBC", body: "✅ Teste — esta notificação veio do seu login." });
  return NextResponse.json({ login: session.login, ...r });
}
