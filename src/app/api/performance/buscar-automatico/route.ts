import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { salvarSnapshotSemanal, segundaFeiraDeHoje, hojeYYYYMMDD, CAMPOS_NUMERICOS } from "@/lib/performanceSave";
import { buscarResumoInstagram } from "@/lib/redesSociais/instagram";
import { buscarResumoYoutube, buscarAnalyticsYoutube, refreshYoutubeAccessToken } from "@/lib/redesSociais/youtube";

export async function POST() {
  const session = await getSession();
  if (!canWrite(session)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const inicioSemana = segundaFeiraDeHoje();
  const hoje = hojeYYYYMMDD();

  // Parte de dados já existentes para esta semana (ex.: Stories lançados à mão) em vez de zerar
  // tudo que a API não cobre.
  const existente = await prisma.snapshotSemanal.findUnique({ where: { inicioSemana } });
  const campos: Record<string, number> = {};
  for (const campo of CAMPOS_NUMERICOS) {
    campos[campo] = existente ? (existente as unknown as Record<string, number>)[campo] : 0;
  }
  let ytCtr = existente?.ytCtr ?? 0;
  const avisos: string[] = [];
  let algumaRedeBuscada = false;

  const integracoes = await prisma.integracaoSocial.findMany();
  const instagram = integracoes.find((i) => i.rede === "INSTAGRAM");
  const youtube = integracoes.find((i) => i.rede === "YOUTUBE");

  if (instagram?.accessToken) {
    try {
      const desde = Math.floor(new Date(`${inicioSemana}T00:00:00`).getTime() / 1000);
      const ate = Math.floor(new Date(`${hoje}T23:59:59`).getTime() / 1000);
      const resumo = await buscarResumoInstagram(instagram.accessToken, instagram.contaId, desde, ate);
      campos.igSeguidores = resumo.seguidores;
      campos.igContasAlcancadas = resumo.contasAlcancadas;
      campos.igImpressoes = resumo.impressoes;
      algumaRedeBuscada = true;
    } catch (err) {
      avisos.push(`Instagram: ${err instanceof Error ? err.message : "erro ao buscar dados"}.`);
    }
  } else {
    avisos.push("Instagram não está conectado — conecte em /integracoes-sociais.");
  }

  if (youtube?.refreshToken) {
    try {
      const { accessToken, expiraEm } = await refreshYoutubeAccessToken(youtube.refreshToken);
      await prisma.integracaoSocial.update({ where: { rede: "YOUTUBE" }, data: { accessToken, expiraEm } });

      const resumo = await buscarResumoYoutube(accessToken);
      campos.ytInscritos = resumo.inscritos;

      const analytics = await buscarAnalyticsYoutube(accessToken, inicioSemana, hoje);
      campos.ytVisualizacoes = analytics.visualizacoes;
      campos.ytInscritosGanhos = analytics.inscritosGanhos;
      campos.ytTempoExibicaoMin = analytics.tempoExibicaoMin;
      campos.ytDuracaoMediaSeg = analytics.duracaoMediaSeg;
      campos.ytImpressoes = analytics.impressoes;
      ytCtr = analytics.ctr;
      if (analytics.erroImpressoes) {
        avisos.push("YouTube: impressões e CTR não são liberados pela API do Google — continue lançando esses dois campos manualmente.");
      }
      algumaRedeBuscada = true;
    } catch (err) {
      avisos.push(`YouTube: ${err instanceof Error ? err.message : "erro ao buscar dados"}.`);
    }
  } else {
    avisos.push("YouTube não está conectado — conecte em /integracoes-sociais.");
  }

  if (!algumaRedeBuscada) {
    return NextResponse.json({ error: "Nenhuma rede conectada para buscar dados.", avisos }, { status: 400 });
  }

  const snapshot = await salvarSnapshotSemanal({
    inicioSemana,
    origemDados: "api",
    ytCtr,
    campos,
    posts: [],
  });

  return NextResponse.json({ snapshot, avisos });
}
