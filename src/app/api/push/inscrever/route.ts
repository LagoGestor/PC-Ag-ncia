import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { enviarPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const sub = await req.json();
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });

  // Mesmo aparelho pode trocar de usuário (logout/login): a inscrição passa a ser de quem ativou por último.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { usuarioId: session.sub, endpoint, p256dh, auth },
    update: { usuarioId: session.sub, p256dh, auth },
  });
  await enviarPush([session.sub], { title: "Agência LBC", body: "Notificações ativadas neste aparelho ✅" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, usuarioId: session.sub } });
  return NextResponse.json({ ok: true });
}
