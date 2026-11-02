import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { agoraBRT } from "@/lib/atraso";
import { marcarAtrasadas } from "@/lib/marcarAtrasadas";
import { RESPONSAVEL_ARMAZENAR, STATUS_BADGE_CLASS, STATUS_COLORS } from "@/types";

// Página aberta (sem login e sem navegação): só mostra as postagens da semana, pra ser compartilhada/exibida.
// Não expõe responsável, descrição nem link de detalhe.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Postagens da Semana - Agência LBC",
  robots: { index: false, follow: false },
};

const DIA = 86400000;
const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const fmt = (t: number, o: Intl.DateTimeFormatOptions) => new Date(t).toLocaleDateString("pt-BR", { ...o, timeZone: "UTC" });

export default async function SemanaPublicaPage() {
  await marcarAtrasadas();

  // Semana (segunda a domingo) de hoje no horário de Brasília; conta em UTC só pra não depender do fuso do servidor.
  const [y, m, d] = agoraBRT().data.split("-").map(Number);
  const hoje = Date.UTC(y, m - 1, d);
  const segunda = hoje - ((new Date(hoje).getUTCDay() + 6) % 7) * DIA;
  const dias = Array.from({ length: 7 }, (_, i) => segunda + i * DIA);

  const posts = await prisma.tarefa.findMany({
    where: {
      arquivada: false,
      fixa: false,
      redeSocial: { not: "" },
      responsavel: { not: RESPONSAVEL_ARMAZENAR },
      entrega: { gte: iso(dias[0]), lte: iso(dias[6]) },
    },
    select: { id: true, tarefa: true, tipo: true, redeSocial: true, entrega: true, horarioPublicacao: true, status: true },
  });
  posts.sort((a, b) => (a.horarioPublicacao || "99:99").localeCompare(b.horarioPublicacao || "99:99"));

  return (
    <main className="semana-publica">
      <meta httpEquiv="refresh" content="600" />
      <header className="semana-publica-header">
        <h1>Postagens da Semana</h1>
        <span>
          {fmt(dias[0], { day: "2-digit", month: "short" })} – {fmt(dias[6], { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </header>

      <div className="ps-grid">
        {dias.map((t) => {
          const key = iso(t);
          const doDia = posts.filter((p) => p.entrega === key);
          return (
            <section key={key} className={`ps-day${t === hoje ? " today" : ""}`}>
              <div className="ps-day-head">
                <span className="ps-day-name">{NOMES_DIA[new Date(t).getUTCDay()]}</span>
                <span className="ps-day-num">{new Date(t).getUTCDate()}</span>
              </div>
              <div className="ps-day-body">
                {doDia.length === 0 ? (
                  <div className="ps-empty">Sem postagens</div>
                ) : (
                  doDia.map((p) => (
                    <div
                      key={p.id}
                      className="ps-post"
                      style={{ ["--ps-color" as string]: STATUS_COLORS[p.status] || "var(--gray)", cursor: "default" }}
                    >
                      <div className="ps-post-time">{p.horarioPublicacao || "—"}</div>
                      <div className="ps-post-chips">
                        {p.tipo && <span className="ps-chip">{p.tipo}</span>}
                        <span className="ps-chip ps-chip-rede">{p.redeSocial}</span>
                      </div>
                      <div className="ps-post-title">{p.tarefa}</div>
                      <div className="ps-post-foot">
                        <span className={`card-badge ${STATUS_BADGE_CLASS[p.status] || ""}`}>{p.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
