import webpush from "web-push";
import { prisma } from "./prisma";

// As chaves VAPID ficam no banco e nascem sozinhas no primeiro uso — não precisa configurar nada na Vercel.
export async function getVapid() {
  let cfg = await prisma.pushConfig.findUnique({ where: { id: "vapid" } });
  if (!cfg) {
    const k = webpush.generateVAPIDKeys();
    cfg = await prisma.pushConfig.upsert({
      where: { id: "vapid" },
      create: { id: "vapid", publicKey: k.publicKey, privateKey: k.privateKey },
      update: {},
    });
  }
  return cfg;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Manda pra todos os aparelhos dos usuários indicados. Aparelho que não existe mais (404/410) é apagado.
export async function enviarPush(usuarioIds: string[], payload: PushPayload): Promise<number> {
  if (usuarioIds.length === 0) return 0;
  const [vapid, subs] = await Promise.all([
    getVapid(),
    prisma.pushSubscription.findMany({ where: { usuarioId: { in: usuarioIds } } }),
  ]);
  const options = { vapidDetails: { subject: "https://agencialbc.vercel.app", publicKey: vapid.publicKey, privateKey: vapid.privateKey } };
  const corpo = JSON.stringify({ ...payload, url: payload.url ?? "/" });

  let enviados = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, corpo, options);
        enviados++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    })
  );
  return enviados;
}
