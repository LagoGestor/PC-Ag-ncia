export const YOUTUBE_REDIRECT_URI = "https://agencialbc.vercel.app/api/integracoes/youtube/callback";

export function youtubeConfigurado(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getYoutubeAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: YOUTUBE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface YoutubeConexao {
  accessToken: string;
  refreshToken: string;
  expiraEm: Date;
  contaId: string;
  contaNome: string;
}

export async function exchangeYoutubeCode(code: string): Promise<YoutubeConexao> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Integração do YouTube não configurada (faltam GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || "Falha ao trocar código por token do YouTube.");
  }

  const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || "",
    expiraEm: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000),
    contaId: channel?.id || "",
    contaNome: channel?.snippet?.title || "",
  };
}

export async function refreshYoutubeAccessToken(refreshToken: string): Promise<{ accessToken: string; expiraEm: Date }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Integração do YouTube não configurada.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data.error_description || "Falha ao renovar token do YouTube.");
  return { accessToken: data.access_token, expiraEm: new Date(Date.now() + (data.expires_in ?? 3600) * 1000) };
}

export interface YoutubeResumo {
  inscritos: number;
  visualizacoesTotais: number;
}

export async function buscarResumoYoutube(accessToken: string): Promise<YoutubeResumo> {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  const stats = data.items?.[0]?.statistics;
  return {
    inscritos: Number(stats?.subscriberCount || 0),
    visualizacoesTotais: Number(stats?.viewCount || 0),
  };
}
