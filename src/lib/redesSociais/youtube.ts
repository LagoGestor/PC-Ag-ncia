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

export interface YoutubeAnalyticsSemana {
  visualizacoes: number;
  inscritosGanhos: number;
  tempoExibicaoMin: number;
  duracaoMediaSeg: number;
  impressoes: number;
  ctr: number;
}

// startDate/endDate no formato YYYY-MM-DD. CTR/impressões de canal são um recurso mais novo da
// API — se a conta não tiver esse dado disponível, devolvemos 0 ali em vez de derrubar o resto.
export async function buscarAnalyticsYoutube(accessToken: string, startDate: string, endDate: string): Promise<YoutubeAnalyticsSemana> {
  const base = "https://youtubeanalytics.googleapis.com/v2/reports";
  const headers = { Authorization: `Bearer ${accessToken}` };

  const basicoParams = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained",
  });
  const basicoRes = await fetch(`${base}?${basicoParams}`, { headers });
  const basico = await basicoRes.json();
  if (!basicoRes.ok) throw new Error(basico.error?.message || "Falha ao buscar YouTube Analytics.");
  const [views, minutosAssistidos, duracaoMedia, inscritosGanhos] = basico.rows?.[0] || [0, 0, 0, 0];

  let impressoes = 0;
  let ctr = 0;
  try {
    const impParams = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "impressions,impressionsClickThroughRate",
    });
    const impRes = await fetch(`${base}?${impParams}`, { headers });
    const imp = await impRes.json();
    if (impRes.ok && imp.rows?.[0]) {
      impressoes = imp.rows[0][0] || 0;
      const ctrBruto = imp.rows[0][1] || 0;
      ctr = ctrBruto <= 1 ? ctrBruto * 100 : ctrBruto; // a API às vezes devolve fração (0-1), às vezes já em %
    }
  } catch {
    // impressões/CTR de canal nem sempre estão disponíveis — segue sem eles.
  }

  return {
    visualizacoes: views || 0,
    inscritosGanhos: inscritosGanhos || 0,
    tempoExibicaoMin: Math.round(minutosAssistidos || 0),
    duracaoMediaSeg: Math.round(duracaoMedia || 0),
    impressoes,
    ctr,
  };
}
