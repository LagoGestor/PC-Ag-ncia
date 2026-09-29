import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Disparado pelo Cron do Vercel (vercel.json) todo dia — sem sessão de usuário, por isso a
// autenticação é por segredo compartilhado (mesmo padrão dos Cron Jobs do Vercel), não por login.
export async function GET(req: NextRequest) {
  // O Cron do Vercel manda o segredo no header Authorization; pra dar pra testar colando o link
  // direto no navegador (que não manda header nenhum), aceita também por parâmetro ?secret=.
  const secret = process.env.CRON_SECRET;
  const secretRecebido = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("secret");
  if (secret && secretRecebido !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // ?teste=1 força o envio de uma mensagem fixa, sem depender de hoje ser aniversário de
  // ninguém — só pra validar que o WhatsApp está mesmo entregando, antes de confiar no cron.
  const teste = req.nextUrl.searchParams.get("teste") === "1";

  let texto: string;
  let nomes = "";
  if (teste) {
    texto = "✅ Teste de aviso da Agência LBC — se você recebeu isso, está tudo funcionando.";
  } else {
    const hoje = new Date();
    const aniversariantes = await prisma.aniversariante.findMany({
      where: { dia: hoje.getDate(), mes: hoje.getMonth() + 1 },
    });

    if (aniversariantes.length === 0) {
      return NextResponse.json({ enviado: false, motivo: "Nenhum aniversariante hoje." });
    }

    nomes = aniversariantes.map((a) => a.nome).join(", ");
    texto = aniversariantes.length === 1 ? `🎂 Hoje é aniversário de ${nomes}!` : `🎂 Hoje é aniversário de: ${nomes}!`;
  }

  const idInstance = process.env.GREEN_API_ID_INSTANCE;
  const apiToken = process.env.GREEN_API_TOKEN_INSTANCE;
  const phone = process.env.WHATSAPP_PHONE;
  if (!idInstance || !apiToken || !phone) {
    return NextResponse.json(
      { enviado: false, erro: "GREEN_API_ID_INSTANCE/GREEN_API_TOKEN_INSTANCE/WHATSAPP_PHONE não configurados." },
      { status: 500 }
    );
  }

  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: `${phone}@c.us`, message: texto }),
  });
  if (!res.ok) {
    return NextResponse.json({ enviado: false, erro: `Green API respondeu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ enviado: true, aniversariantes: nomes });
}
