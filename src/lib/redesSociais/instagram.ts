const GRAPH_VERSION = "v21.0";
export const INSTAGRAM_REDIRECT_URI = "https://agencialbc.vercel.app/api/integracoes/instagram/callback";

export function instagramConfigurado(): boolean {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function getInstagramAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    scope: "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

interface InstagramConexao {
  accessToken: string;
  contaId: string;
  contaNome: string;
}

// Troca o "code" do OAuth por um token de longa duração e descobre a conta profissional
// do Instagram vinculada a alguma das Páginas do Facebook do usuário que autorizou.
export async function exchangeInstagramCode(code: string): Promise<InstagramConexao> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Integração do Instagram não configurada (faltam META_APP_ID/META_APP_SECRET).");

  const tokenRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
      new URLSearchParams({ client_id: appId, redirect_uri: INSTAGRAM_REDIRECT_URI, client_secret: appSecret, code })
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error?.message || "Falha ao trocar código por token do Instagram.");
  }

  const longLivedRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: tokenData.access_token,
      })
  );
  const longLivedData = await longLivedRes.json();
  const userToken: string = longLivedData.access_token || tokenData.access_token;

  const pagesRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?access_token=${userToken}`);
  const pagesData = await pagesRes.json();
  const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data || [];

  for (const page of pages) {
    const igRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    const igId = igData?.instagram_business_account?.id;
    if (igId) {
      const usernameRes = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${igId}?fields=username&access_token=${page.access_token}`
      );
      const usernameData = await usernameRes.json();
      return {
        accessToken: page.access_token,
        contaId: igId,
        contaNome: usernameData.username || page.name || "",
      };
    }
  }

  throw new Error("Nenhuma conta Instagram Profissional/Criador foi encontrada vinculada às suas Páginas do Facebook.");
}

export interface InstagramResumo {
  seguidores: number;
  contasAlcancadas: number;
  impressoes: number;
}

export async function buscarResumoInstagram(accessToken: string, contaId: string, desde: number, ate: number): Promise<InstagramResumo> {
  const perfilRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${contaId}?fields=followers_count&access_token=${accessToken}`);
  const perfil = await perfilRes.json();

  const insightsRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${contaId}/insights?metric=reach,impressions&period=day&since=${desde}&until=${ate}&access_token=${accessToken}`
  );
  const insights = await insightsRes.json();
  const somaMetrica = (nome: string) =>
    (insights.data?.find((m: { name: string }) => m.name === nome)?.values || []).reduce(
      (acc: number, v: { value: number }) => acc + (v.value || 0),
      0
    );

  return {
    seguidores: perfil.followers_count || 0,
    contasAlcancadas: somaMetrica("reach"),
    impressoes: somaMetrica("impressions"),
  };
}
