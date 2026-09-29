import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Disparado pelo Cron do Vercel (vercel.json) todo dia — sem sessão de usuário, por isso a
// autenticação é por segredo compartilhado (mesmo padrão dos Cron Jobs do Vercel), não por login.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const hoje = new Date();
  const aniversariantes = await prisma.aniversariante.findMany({
    where: { dia: hoje.getDate(), mes: hoje.getMonth() + 1 },
  });

  if (aniversariantes.length === 0) {
    return NextResponse.json({ enviado: false, motivo: "Nenhum aniversariante hoje." });
  }

  const nomes = aniversariantes.map((a) => a.nome).join(", ");
  const texto = aniversariantes.length === 1 ? `🎂 Hoje é aniversário de ${nomes}!` : `🎂 Hoje é aniversário de: ${nomes}!`;

  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    return NextResponse.json({ enviado: false, erro: "CALLMEBOT_PHONE/CALLMEBOT_APIKEY não configurados." }, { status: 500 });
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(apikey)}&text=${encodeURIComponent(texto)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ enviado: false, erro: `CallMeBot respondeu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ enviado: true, aniversariantes: nomes });
}
