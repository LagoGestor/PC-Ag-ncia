import type { SnapshotSemanal } from "@/types";

export function variacaoPct(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / anterior) * 100;
}

export function fmtVariacao(v: number | null): string {
  if (v === null) return "sem comparativo";
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${v.toFixed(1)}%`;
}

export function taxaEngajamentoIg(s: Pick<SnapshotSemanal, "igCurtidas" | "igComentarios" | "igCompartilhamentos" | "igSalvamentos" | "igContasAlcancadas">): number {
  const interacoes = s.igCurtidas + s.igComentarios + s.igCompartilhamentos + s.igSalvamentos;
  return s.igContasAlcancadas > 0 ? (interacoes / s.igContasAlcancadas) * 100 : 0;
}

export function gerarDiagnostico(
  atual: SnapshotSemanal,
  anterior: SnapshotSemanal | null
): { diagnostico: string; recomendacoes: string } {
  const linhas: string[] = [];
  const recs: string[] = [];

  const seguidoresDelta = anterior ? variacaoPct(atual.igSeguidores, anterior.igSeguidores) : null;
  const inscritosDelta = anterior ? variacaoPct(atual.ytInscritos, anterior.ytInscritos) : null;
  linhas.push(
    `📈 Crescimento: Instagram ganhou ${atual.igSeguidoresGanhos} seguidor(es) nesta semana (${atual.igSeguidores.toLocaleString("pt-BR")} no total${
      seguidoresDelta !== null ? `, ${fmtVariacao(seguidoresDelta)} vs. semana anterior` : ""
    }). YouTube ganhou ${atual.ytInscritosGanhos} inscrito(s) (${atual.ytInscritos.toLocaleString("pt-BR")} no total${
      inscritosDelta !== null ? `, ${fmtVariacao(inscritosDelta)}` : ""
    }).`
  );

  const alcanceDelta = anterior ? variacaoPct(atual.igContasAlcancadas, anterior.igContasAlcancadas) : null;
  const impressoesYtDelta = anterior ? variacaoPct(atual.ytImpressoes, anterior.ytImpressoes) : null;
  linhas.push(
    `👁️ Alcance: ${atual.igContasAlcancadas.toLocaleString("pt-BR")} contas alcançadas no Instagram${
      alcanceDelta !== null ? ` (${fmtVariacao(alcanceDelta)})` : ""
    }; ${atual.ytImpressoes.toLocaleString("pt-BR")} impressões no YouTube${
      impressoesYtDelta !== null ? ` (${fmtVariacao(impressoesYtDelta)})` : ""
    }.`
  );

  const engAtual = taxaEngajamentoIg(atual);
  const engAnterior = anterior ? taxaEngajamentoIg(anterior) : null;
  linhas.push(
    `💬 Engajamento: taxa de ${engAtual.toFixed(1)}% no Instagram (curtidas, comentários, compartilhamentos e salvamentos sobre contas alcançadas)${
      engAnterior !== null ? `, ante ${engAnterior.toFixed(1)}% na semana anterior` : ""
    }.`
  );

  if (atual.posts.length > 0) {
    const ordenados = [...atual.posts].sort((a, b) => b.taxaEngajamento - a.taxaEngajamento);
    const melhor = ordenados[0];
    const pior = ordenados[ordenados.length - 1];
    linhas.push(
      `🎥 Desempenho de conteúdo: "${melhor.titulo || melhor.tipo}" foi o destaque da semana (${melhor.taxaEngajamento.toFixed(
        1
      )}% de engajamento).${
        ordenados.length > 1
          ? ` "${pior.titulo || pior.tipo}" teve o menor retorno (${pior.taxaEngajamento.toFixed(1)}%).`
          : ""
      }`
    );
  }

  const ctrDelta = anterior ? variacaoPct(atual.ytCtr, anterior.ytCtr) : null;
  linhas.push(
    `▶️ YouTube: CTR de ${atual.ytCtr.toFixed(1)}%${ctrDelta !== null ? ` (${fmtVariacao(ctrDelta)})` : ""}, ${Math.round(
      atual.ytTempoExibicaoMin / 60
    )}h de tempo de exibição e duração média de visualização de ${atual.ytDuracaoMediaSeg}s.`
  );

  if (atual.igStoriesPublicados > 0) {
    linhas.push(
      `📖 Stories: ${atual.igStoriesPublicados} publicado(s), alcançando ${atual.igStoriesAlcance.toLocaleString(
        "pt-BR"
      )} contas, com ${atual.igStoriesRespostas} resposta(s) e ${atual.igStoriesSaidas} saída(s).`
    );
  }

  if (seguidoresDelta !== null && seguidoresDelta < -5) recs.push("Crescimento de seguidores no Instagram desacelerou — revisar frequência e horários de publicação.");
  if (seguidoresDelta !== null && seguidoresDelta > 15) recs.push("Crescimento de seguidores acelerou — identifique o que impulsionou essa semana e repita a estratégia.");
  if (engAnterior !== null && engAtual < engAnterior - 2) recs.push("Taxa de engajamento em queda — considere formatos com mais interação (enquetes, perguntas, CTA direto nos posts).");
  if (engAnterior !== null && engAtual > engAnterior + 2) recs.push("Engajamento em alta — vale reforçar o formato/tema que gerou esse resultado nas próximas semanas.");
  if (ctrDelta !== null && ctrDelta < -10) recs.push("CTR do YouTube caiu — teste novas thumbnails e títulos mais chamativos.");
  if (atual.igStoriesPublicados === 0) recs.push("Nenhum Story publicado nesta semana — Stories ajudam a manter alcance orgânico ativo entre os posts do feed.");
  if (atual.ytInscritosGanhos <= 0 && anterior) recs.push("Nenhum inscrito ganho no YouTube — vale um CTA mais direto pedindo inscrição nos próximos vídeos.");
  if (recs.length === 0) recs.push("Métricas estáveis nesta semana — manter a cadência atual de publicações.");

  return {
    diagnostico: linhas.join("\n\n"),
    recomendacoes: recs.map((r) => `• ${r}`).join("\n"),
  };
}
