"use client";

import { useEffect, useState } from "react";
import { SnapshotSemanal } from "@/types";
import { taxaEngajamentoIg, variacaoPct, fmtVariacao } from "@/lib/performanceInsights";
import { PerformanceEntryModal } from "./PerformanceEntryModal";
import { ConfirmModal } from "./ConfirmModal";

type Aba = "semana" | "comparativo" | "mes";

function fmtData(d: string) {
  return d ? d.split("-").reverse().join("/") : "—";
}

function fmtNum(n: number) {
  return n.toLocaleString("pt-BR");
}

function DeltaBadge({ v }: { v: number | null }) {
  if (v === null) return <span className="performance-delta neutro">sem comparativo</span>;
  const classe = v > 0 ? "positivo" : v < 0 ? "negativo" : "neutro";
  const icone = v > 0 ? "fa-arrow-up" : v < 0 ? "fa-arrow-down" : "fa-minus";
  return (
    <span className={`performance-delta ${classe}`}>
      <i className={`fas ${icone}`} /> {fmtVariacao(v)}
    </span>
  );
}

function Metrica({ label, valor, delta }: { label: string; valor: string; delta?: number | null }) {
  return (
    <div className="performance-metric">
      <span className="performance-metric-label">{label}</span>
      <span className="performance-metric-value">{valor}</span>
      {delta !== undefined && <DeltaBadge v={delta} />}
    </div>
  );
}

export function PerformanceView() {
  const [snapshots, setSnapshots] = useState<SnapshotSemanal[] | null>(null);
  const [aba, setAba] = useState<Aba>("semana");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SnapshotSemanal | null>(null);

  function carregar() {
    fetch("/api/performance")
      .then((r) => r.json())
      .then(setSnapshots)
      .catch(() => setSnapshots([]));
  }

  useEffect(carregar, []);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/performance/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    carregar();
  }

  if (snapshots === null) {
    return <div className="empty-state"><p>Carregando...</p></div>;
  }

  const atual = snapshots[0] ?? null;
  const anterior = snapshots[1] ?? null;

  return (
    <div className="performance-shell">
      <div className="fixas-header">
        <div>
          <h2 className="fixas-title">Performance das Redes Sociais</h2>
          <p className="fixas-subtitle">Instagram e YouTube — @lagoinhabrasiliacapital</p>
        </div>
        <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Lançar dados da semana
        </button>
      </div>

      <div className="agenda-toggle" style={{ margin: "18px 0" }}>
        <button className={aba === "semana" ? "active" : ""} onClick={() => setAba("semana")}>
          Relatório da Semana
        </button>
        <button className={aba === "comparativo" ? "active" : ""} onClick={() => setAba("comparativo")}>
          Comparativo com a Semana Anterior
        </button>
        <button className={aba === "mes" ? "active" : ""} onClick={() => setAba("mes")}>
          Visão Geral do Mês
        </button>
      </div>

      {!atual ? (
        <div className="empty-state">
          <i className="fas fa-chart-line" />
          <h3>Nenhum dado lançado ainda</h3>
          <p>Clique em &quot;Lançar dados da semana&quot; para registrar o primeiro relatório.</p>
        </div>
      ) : aba === "semana" ? (
        <RelatorioSemana atual={atual} anterior={anterior} onDeletar={() => setDeleteTarget(atual)} />
      ) : aba === "comparativo" ? (
        <Comparativo atual={atual} anterior={anterior} />
      ) : (
        <VisaoMes snapshots={snapshots} />
      )}

      <PerformanceEntryModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={carregar} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Apagar esta semana?"
        text={`Os dados lançados para a semana de ${fmtData(deleteTarget?.inicioSemana ?? "")} serão apagados permanentemente.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function RelatorioSemana({
  atual,
  anterior,
  onDeletar,
}: {
  atual: SnapshotSemanal;
  anterior: SnapshotSemanal | null;
  onDeletar: () => void;
}) {
  const engAtual = taxaEngajamentoIg(atual);
  const engAnterior = anterior ? taxaEngajamentoIg(anterior) : null;
  const postsOrdenados = [...atual.posts].sort((a, b) => b.taxaEngajamento - a.taxaEngajamento);
  const melhor = postsOrdenados[0];
  const pior = postsOrdenados.length > 1 ? postsOrdenados[postsOrdenados.length - 1] : null;

  return (
    <div className="performance-grid">
      <div className="performance-period" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>
          Semana de {fmtData(atual.inicioSemana)} a {fmtData(atual.fimSemana)}
          {atual.origemDados === "manual" ? " · lançamento manual" : " · via API"}
        </span>
        <button className="card-action-btn danger" onClick={onDeletar} title="Apagar esta semana">
          <i className="fas fa-trash" />
        </button>
      </div>

      <div className="performance-card">
        <h3>📈 Crescimento</h3>
        <div className="performance-metric-grid">
          <Metrica
            label="Seguidores Instagram"
            valor={fmtNum(atual.igSeguidores)}
            delta={anterior ? variacaoPct(atual.igSeguidores, anterior.igSeguidores) : undefined}
          />
          <Metrica label="Seguidores ganhos" valor={`+${fmtNum(atual.igSeguidoresGanhos)}`} />
          <Metrica
            label="Inscritos YouTube"
            valor={fmtNum(atual.ytInscritos)}
            delta={anterior ? variacaoPct(atual.ytInscritos, anterior.ytInscritos) : undefined}
          />
          <Metrica label="Inscritos ganhos" valor={`+${fmtNum(atual.ytInscritosGanhos)}`} />
        </div>
      </div>

      <div className="performance-card">
        <h3>👁️ Alcance</h3>
        <div className="performance-metric-grid">
          <Metrica
            label="Contas alcançadas (IG)"
            valor={fmtNum(atual.igContasAlcancadas)}
            delta={anterior ? variacaoPct(atual.igContasAlcancadas, anterior.igContasAlcancadas) : undefined}
          />
          <Metrica
            label="Impressões (IG)"
            valor={fmtNum(atual.igImpressoes)}
            delta={anterior ? variacaoPct(atual.igImpressoes, anterior.igImpressoes) : undefined}
          />
          <Metrica label="Visualizações (IG)" valor={fmtNum(atual.igVisualizacoes)} />
          <Metrica
            label="Impressões (YT)"
            valor={fmtNum(atual.ytImpressoes)}
            delta={anterior ? variacaoPct(atual.ytImpressoes, anterior.ytImpressoes) : undefined}
          />
        </div>
      </div>

      <div className="performance-card">
        <h3>💬 Engajamento</h3>
        <div className="performance-metric-grid">
          <Metrica label="Curtidas" valor={fmtNum(atual.igCurtidas)} />
          <Metrica label="Comentários" valor={fmtNum(atual.igComentarios)} />
          <Metrica label="Compartilhamentos" valor={fmtNum(atual.igCompartilhamentos)} />
          <Metrica label="Salvamentos" valor={fmtNum(atual.igSalvamentos)} />
          <Metrica
            label="Taxa de engajamento"
            valor={`${engAtual.toFixed(1)}%`}
            delta={engAnterior !== null ? engAtual - engAnterior : undefined}
          />
        </div>
      </div>

      {atual.igStoriesPublicados > 0 && (
        <div className="performance-card">
          <h3>📖 Stories</h3>
          <div className="performance-metric-grid">
            <Metrica label="Publicados" valor={fmtNum(atual.igStoriesPublicados)} />
            <Metrica label="Alcance" valor={fmtNum(atual.igStoriesAlcance)} />
            <Metrica label="Impressões" valor={fmtNum(atual.igStoriesImpressoes)} />
            <Metrica label="Respostas" valor={fmtNum(atual.igStoriesRespostas)} />
            <Metrica label="Saídas" valor={fmtNum(atual.igStoriesSaidas)} />
            <Metrica label="Avanços/Voltas" valor={`${fmtNum(atual.igStoriesAvancos)} / ${fmtNum(atual.igStoriesVoltas)}`} />
          </div>
        </div>
      )}

      {postsOrdenados.length > 0 && (
        <div className="performance-card">
          <h3>🎥 Desempenho de conteúdo</h3>
          <div className="performance-posts">
            <div className="performance-post performance-post-melhor">
              <span className="card-badge badge-ativa">Melhor da semana</span>
              <strong>{melhor.titulo || melhor.tipo}</strong>
              <span>{melhor.taxaEngajamento.toFixed(1)}% de engajamento · {melhor.rede === "YOUTUBE" ? "YouTube" : "Instagram"}</span>
            </div>
            {pior && (
              <div className="performance-post performance-post-pior">
                <span className="card-badge badge-atrasada">Menor retorno</span>
                <strong>{pior.titulo || pior.tipo}</strong>
                <span>{pior.taxaEngajamento.toFixed(1)}% de engajamento · {pior.rede === "YOUTUBE" ? "YouTube" : "Instagram"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="performance-card">
        <h3>▶️ YouTube</h3>
        <div className="performance-metric-grid">
          <Metrica label="Visualizações" valor={fmtNum(atual.ytVisualizacoes)} />
          <Metrica label="CTR" valor={`${atual.ytCtr.toFixed(1)}%`} delta={anterior ? variacaoPct(atual.ytCtr, anterior.ytCtr) : undefined} />
          <Metrica label="Tempo de exibição" valor={`${Math.round(atual.ytTempoExibicaoMin / 60)}h`} />
          <Metrica label="Duração média de visualização" valor={`${atual.ytDuracaoMediaSeg}s`} />
        </div>
      </div>

      <div className="performance-card">
        <h3>📊 Comparativo Instagram × YouTube</h3>
        <div className="performance-vs">
          <div>
            <span className="performance-vs-label">Instagram</span>
            <span className="performance-vs-value">{fmtNum(atual.igContasAlcancadas)} alcance</span>
            <span className="performance-vs-value">{engAtual.toFixed(1)}% engajamento</span>
          </div>
          <div className="performance-vs-sep">×</div>
          <div>
            <span className="performance-vs-label">YouTube</span>
            <span className="performance-vs-value">{fmtNum(atual.ytImpressoes)} impressões</span>
            <span className="performance-vs-value">{atual.ytCtr.toFixed(1)}% CTR</span>
          </div>
        </div>
      </div>

      <div className="performance-card performance-card-wide">
        <h3>🔎 Tendências &amp; Diagnóstico</h3>
        <p className="performance-texto">{atual.diagnostico}</p>
      </div>

      <div className="performance-card performance-card-wide">
        <h3>🎯 Insights Estratégicos</h3>
        <p className="performance-texto">{atual.recomendacoes}</p>
      </div>
    </div>
  );
}

function Comparativo({ atual, anterior }: { atual: SnapshotSemanal; anterior: SnapshotSemanal | null }) {
  if (!anterior) {
    return (
      <div className="empty-state">
        <i className="fas fa-scale-balanced" />
        <h3>Ainda não há semana anterior</h3>
        <p>Lance os dados de mais uma semana para ver o comparativo.</p>
      </div>
    );
  }

  const linhas: { label: string; atual: number; anterior: number; sufixo?: string }[] = [
    { label: "Seguidores Instagram", atual: atual.igSeguidores, anterior: anterior.igSeguidores },
    { label: "Contas alcançadas (IG)", atual: atual.igContasAlcancadas, anterior: anterior.igContasAlcancadas },
    { label: "Impressões (IG)", atual: atual.igImpressoes, anterior: anterior.igImpressoes },
    { label: "Curtidas", atual: atual.igCurtidas, anterior: anterior.igCurtidas },
    { label: "Comentários", atual: atual.igComentarios, anterior: anterior.igComentarios },
    { label: "Compartilhamentos", atual: atual.igCompartilhamentos, anterior: anterior.igCompartilhamentos },
    { label: "Salvamentos", atual: atual.igSalvamentos, anterior: anterior.igSalvamentos },
    {
      label: "Taxa de engajamento (IG)",
      atual: Number(taxaEngajamentoIg(atual).toFixed(1)),
      anterior: Number(taxaEngajamentoIg(anterior).toFixed(1)),
      sufixo: "%",
    },
    { label: "Inscritos YouTube", atual: atual.ytInscritos, anterior: anterior.ytInscritos },
    { label: "Visualizações YouTube", atual: atual.ytVisualizacoes, anterior: anterior.ytVisualizacoes },
    { label: "CTR YouTube", atual: atual.ytCtr, anterior: anterior.ytCtr, sufixo: "%" },
    { label: "Tempo de exibição (min)", atual: atual.ytTempoExibicaoMin, anterior: anterior.ytTempoExibicaoMin },
  ];

  return (
    <div className="performance-comparativo">
      <div className="performance-period">
        {fmtData(atual.inicioSemana)}–{fmtData(atual.fimSemana)} vs. {fmtData(anterior.inicioSemana)}–{fmtData(anterior.fimSemana)}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Esta semana</th>
              <th>Semana anterior</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.label}>
                <td>{l.label}</td>
                <td>{fmtNum(l.atual)}{l.sufixo ?? ""}</td>
                <td>{fmtNum(l.anterior)}{l.sufixo ?? ""}</td>
                <td>
                  <DeltaBadge v={variacaoPct(l.atual, l.anterior)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisaoMes({ snapshots }: { snapshots: SnapshotSemanal[] }) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const doMes = snapshots.filter((s) => {
    const [y, m] = s.inicioSemana.split("-").map(Number);
    return y === anoAtual && m - 1 === mesAtual;
  });

  if (doMes.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-calendar" />
        <h3>Sem dados neste mês ainda</h3>
        <p>Lance os dados das semanas deste mês para ver a visão geral.</p>
      </div>
    );
  }

  const soma = (fn: (s: SnapshotSemanal) => number) => doMes.reduce((acc, s) => acc + fn(s), 0);
  const media = (fn: (s: SnapshotSemanal) => number) => soma(fn) / doMes.length;
  const ultimoDoMes = doMes[0];
  const primeiroDoMes = doMes[doMes.length - 1];

  return (
    <div className="performance-grid">
      <div className="performance-period">
        {doMes.length} semana(s) registrada(s) em {hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
      </div>

      <div className="performance-card">
        <h3>📈 Crescimento no mês</h3>
        <div className="performance-metric-grid">
          <Metrica label="Seguidores ganhos (IG)" valor={`+${fmtNum(soma((s) => s.igSeguidoresGanhos))}`} />
          <Metrica label="Inscritos ganhos (YT)" valor={`+${fmtNum(soma((s) => s.ytInscritosGanhos))}`} />
          <Metrica
            label="Seguidores no fim do mês"
            valor={fmtNum(ultimoDoMes.igSeguidores)}
            delta={variacaoPct(ultimoDoMes.igSeguidores, primeiroDoMes.igSeguidores)}
          />
        </div>
      </div>

      <div className="performance-card">
        <h3>👁️ Alcance acumulado</h3>
        <div className="performance-metric-grid">
          <Metrica label="Contas alcançadas (IG)" valor={fmtNum(soma((s) => s.igContasAlcancadas))} />
          <Metrica label="Impressões (IG)" valor={fmtNum(soma((s) => s.igImpressoes))} />
          <Metrica label="Impressões (YT)" valor={fmtNum(soma((s) => s.ytImpressoes))} />
        </div>
      </div>

      <div className="performance-card">
        <h3>💬 Engajamento médio</h3>
        <div className="performance-metric-grid">
          <Metrica label="Taxa média de engajamento (IG)" valor={`${media(taxaEngajamentoIg).toFixed(1)}%`} />
          <Metrica label="Curtidas no mês" valor={fmtNum(soma((s) => s.igCurtidas))} />
          <Metrica label="Comentários no mês" valor={fmtNum(soma((s) => s.igComentarios))} />
        </div>
      </div>

      <div className="performance-card">
        <h3>▶️ YouTube no mês</h3>
        <div className="performance-metric-grid">
          <Metrica label="Visualizações" valor={fmtNum(soma((s) => s.ytVisualizacoes))} />
          <Metrica label="CTR médio" valor={`${media((s) => s.ytCtr).toFixed(1)}%`} />
          <Metrica label="Tempo de exibição" valor={`${Math.round(soma((s) => s.ytTempoExibicaoMin) / 60)}h`} />
        </div>
      </div>
    </div>
  );
}
