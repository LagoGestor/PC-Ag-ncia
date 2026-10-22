import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";
import { agoraBRT } from "@/lib/atraso";
import { marcarAtrasadas } from "@/lib/marcarAtrasadas";
import { avisarAniversarios, avisarPrazos, gerarFixasDaSemana } from "@/lib/avisos";

// Disparado pelo Cron do Vercel (vercel.json) — sem sessão de usuário, então a autenticação é por segredo
// compartilhado: header Authorization (o Vercel manda sozinho) ou ?secret= (pra testar no navegador).
//   ?momento=manha (padrão): gera as atividades fixas da semana, avisa aniversários e resume os prazos do dia.
//   ?momento=tarde: lembra o que ainda está em aberto hoje.
//   ?teste=1: manda uma notificação de teste pra todo mundo que ativou.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const secretRecebido = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.nextUrl.searchParams.get("secret");
  if (secret && secretRecebido !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (req.nextUrl.searchParams.get("teste") === "1") {
    const usuarios = await prisma.usuario.findMany({ where: { pushSubscriptions: { some: {} } }, select: { id: true } });
    const r = await enviarPush(
      usuarios.map((u) => u.id),
      { title: "Agência LBC", body: "✅ Teste de aviso — as notificações estão funcionando." }
    );
    const totalAparelhos = await prisma.pushSubscription.count();
    return NextResponse.json({ teste: true, usuariosComAparelho: usuarios.length, aparelhosCadastrados: totalAparelhos, ...r });
  }

  const momento = req.nextUrl.searchParams.get("momento") === "tarde" ? "tarde" : "manha";
  const { data } = agoraBRT();

  await marcarAtrasadas();
  const resultado: Record<string, number> = {};
  if (momento === "manha") {
    resultado.fixasCriadas = await gerarFixasDaSemana(data);
    resultado.aniversariantes = await avisarAniversarios(data);
  }
  resultado.avisosDePrazo = await avisarPrazos(momento, data);

  return NextResponse.json({ momento, ...resultado });
}
