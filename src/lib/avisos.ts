import { prisma } from "./prisma";
import { enviarPush } from "./push";
import { RESPONSAVEL_ARMAZENAR } from "@/types";

const DIA = 86400000;
const DIAS_FIXA: Record<string, number> = { Domingo: 0, Segunda: 1, "Terça": 2, Quarta: 3, Quinta: 4, Sexta: 5, "Sábado": 6 };
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Cria as tarefas da semana (de hoje até domingo) a partir das atividades fixas — uma por fixa, por semana.
// `hoje` é "AAAA-MM-DD" no fuso de Brasília; a conta é feita em UTC só pra não depender do fuso do servidor.
export async function gerarFixasDaSemana(hoje: string): Promise<number> {
  const [y, m, d] = hoje.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const segunda = base - ((new Date(base).getUTCDay() + 6) % 7) * DIA;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

  const fixas = await prisma.tarefa.findMany({ where: { fixa: true, arquivada: false, responsavel: { not: RESPONSAVEL_ARMAZENAR } } });
  let criadas = 0;
  for (const f of fixas) {
    const wd = DIAS_FIXA[f.diaSemana];
    if (wd === undefined) continue;
    const dataAlvo = segunda + ((wd + 6) % 7) * DIA;
    if (dataAlvo < base) continue; // dia já passou nesta semana: não cria tarefa nascida atrasada

    const ja = await prisma.tarefa.findFirst({
      where: { origemFixaId: f.id, entrega: { gte: iso(segunda), lte: iso(segunda + 6 * DIA) } },
      select: { id: true },
    });
    if (ja) continue;

    await prisma.tarefa.create({
      data: {
        tarefa: f.tarefa,
        area: f.area,
        tipo: f.tipo,
        redeSocial: f.redeSocial,
        responsavel: f.responsavel,
        descricao: f.descricao,
        link: f.link,
        linksExtras: f.linksExtras,
        solicitacao: hoje,
        entrega: iso(dataAlvo),
        horarioPublicacao: f.horarioPublicacao,
        status: "Ativa",
        origemFixaId: f.id,
      },
    });
    criadas++;
  }
  return criadas;
}

// Aniversariantes de hoje → notificação pra Master e Diretor de Conteúdo.
export async function avisarAniversarios(hoje: string): Promise<number> {
  const [, mes, dia] = hoje.split("-").map(Number);
  const aniversariantes = await prisma.aniversariante.findMany({ where: { dia, mes } });
  if (aniversariantes.length === 0) return 0;

  const nomes = aniversariantes.map((a) => a.nome).join(", ");
  const destinatarios = await prisma.usuario.findMany({ where: { nivel: { in: ["MASTER", "DIRETOR_CONTEUDO"] } }, select: { id: true } });
  await enviarPush(
    destinatarios.map((u) => u.id),
    { title: "🎂 Aniversário hoje", body: nomes, url: "/aniversariantes" }
  );
  return aniversariantes.length;
}

// Prazos: de manhã resume as entregas de hoje + atrasadas; à tarde lembra o que ainda está em aberto hoje.
export async function avisarPrazos(momento: "manha" | "tarde", hoje: string): Promise<number> {
  const abertas = await prisma.tarefa.findMany({
    where: {
      arquivada: false,
      fixa: false,
      responsavel: { not: RESPONSAVEL_ARMAZENAR },
      status: { notIn: ["Concluída", "Agendada", "Cancelada", "Inativa"] },
      OR: [{ entrega: hoje }, { status: "Atrasada" }],
    },
    orderBy: { horarioPublicacao: "asc" },
  });
  const usuarios = await prisma.usuario.findMany({ where: { pushSubscriptions: { some: {} } } });

  const linha = (t: { horarioPublicacao: string; tarefa: string }) => `${t.horarioPublicacao ? t.horarioPublicacao + " " : ""}${t.tarefa}`;
  const resumo = (lista: { horarioPublicacao: string; tarefa: string }[]) =>
    lista.slice(0, 3).map(linha).join("\n") + (lista.length > 3 ? `\n+${lista.length - 3}…` : "");

  let enviados = 0;
  for (const u of usuarios) {
    const minhas = u.nivel === "MASTER" ? abertas : abertas.filter((t) => u.responsavel && t.responsavel === u.responsavel);
    const deHoje = minhas.filter((t) => t.entrega === hoje);
    const atrasadas = minhas.filter((t) => t.status === "Atrasada");
    const equipe = u.nivel === "MASTER" ? " da equipe" : "";

    let title: string;
    let body: string;
    if (momento === "manha") {
      if (deHoje.length === 0 && atrasadas.length === 0) continue;
      title = deHoje.length ? `${plural(deHoje.length, "entrega", "entregas")} hoje${equipe}` : `Atividades atrasadas${equipe}`;
      body = [deHoje.length ? resumo(deHoje) : "", atrasadas.length ? `⚠️ ${plural(atrasadas.length, "atrasada", "atrasadas")}` : ""].filter(Boolean).join("\n");
    } else {
      if (deHoje.length === 0) continue;
      title = `Ainda falta entregar hoje${equipe}`;
      body = resumo(deHoje);
    }
    enviados += (await enviarPush([u.id], { title, body, url: "/" })).enviados;
  }
  return enviados;
}

// Tarefa criada pra alguém (ou passada pra alguém) → avisa essa pessoa, a não ser que ela mesma tenha feito isso.
export async function avisarTarefaAtribuida(
  t: { tarefa: string; responsavel: string; entrega: string; horarioPublicacao: string; fixa: boolean; arquivada: boolean },
  autor: { sub: string; nome: string }
): Promise<void> {
  if (t.fixa || t.arquivada || !t.responsavel || t.responsavel === RESPONSAVEL_ARMAZENAR) return;
  const alvos = await prisma.usuario.findMany({ where: { responsavel: t.responsavel, id: { not: autor.sub } }, select: { id: true } });
  if (alvos.length === 0) return;

  const entrega = t.entrega ? `Entrega ${t.entrega.split("-").reverse().slice(0, 2).join("/")}${t.horarioPublicacao ? " às " + t.horarioPublicacao : ""}` : "";
  await enviarPush(
    alvos.map((u) => u.id),
    { title: "Nova tarefa para você", body: [t.tarefa, entrega, autor.nome ? `Por ${autor.nome}` : ""].filter(Boolean).join("\n"), url: "/" }
  );
}
