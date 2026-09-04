export type Status = "Ativa" | "Pendente" | "Atrasada" | "Concluído" | "Cancelado" | "Inativa";

export interface Tarefa {
  id: string;
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  link: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  horarioPublicacao: string;
  status: Status;
  arquivada: boolean;
  fixa: boolean;
  diaSemana: string;
}

export const AREAS = [
  "Comunicação",
  "Lagoinha Brasília",
  "Ministérios LBC",
  "Estúdio Podcast",
  "Regional DF",
  "Missão Global",
  "Lagoinha Global",
];

export const TIPOS = [
  "Administrativo",
  "Card",
  "Carrossel Design",
  "Carrossel Simples",
  "Documentação",
  "Fotografia",
  "Gráfica",
  "Gravação",
  "Impulsionamento",
  "Lagoinha News",
  "LED",
  "PDF",
  "Post",
  "PPT",
  "Reels",
  "Site",
  "Story",
  "Thumbnail",
  "VOD",
  "Wathsapp",
  "Outro",
];

// Tipo groupings used by the Agenda's "Cronograma de Postagens" / "Tarefas fora das Redes" filter.
export const TIPOS_CRONOGRAMA_POSTAGENS = ["Card", "Carrossel Design", "Carrossel Simples", "Reels", "Story", "Post"];

export const TIPOS_FORA_DAS_REDES = [
  "Administrativo",
  "Documentação",
  "Fotografia",
  "Gráfica",
  "Gravação",
  "Impulsionamento",
  "Lagoinha News",
  "LED",
  "Outro",
  "PDF",
  "PPT",
  "Site",
  "Thumbnail",
  "VOD",
  "Wathsapp",
];

export const RESPONSAVEL_ARMAZENAR = "Armazenar";

export const RESPONSAVEIS = [
  RESPONSAVEL_ARMAZENAR,
  "Leo Felix",
  "Ana Júlia",
  "Anna Beatriz",
  "Júlia Viegas",
  "Dayane Prado",
  "Caio Emanuel",
  "Voluntário",
];

// Everyone except "Armazenar" — used for the team roster, mobile person pages and filter dropdowns.
// Tasks assigned to "Armazenar" are only visible in the DIRECIONAR view.
export const RESPONSAVEIS_VISIVEIS = RESPONSAVEIS.filter((r) => r !== RESPONSAVEL_ARMAZENAR);

export const STATUSES: Status[] = ["Ativa", "Pendente", "Atrasada", "Concluído", "Cancelado", "Inativa"];

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const STATUS_COLORS: Record<string, string> = {
  Ativa: "#4ade80",
  Pendente: "#fbbf24",
  Atrasada: "#f87171",
  Concluído: "#38bdf8",
  Cancelado: "#6b7280",
  Inativa: "#ffffff",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  Ativa: "badge-ativa",
  Pendente: "badge-pendente",
  Atrasada: "badge-atrasada",
  Concluído: "badge-concluido",
  Cancelado: "badge-cancelado",
  Inativa: "badge-inativa",
};

export const FOTOS_RESPONSAVEL: Record<string, string> = {
  "Leo Felix": "/img/perfil_leo.jpg",
  "Ana Júlia": "/img/perfil_anajulia.jpg",
  "Anna Beatriz": "/img/perfil_annabea.jpg",
  "Dayane Prado": "/img/perfil_dayane.jpg",
  "Júlia Viegas": "/img/perfil_julia.jpg",
  "Caio Emanuel": "/img/caio_emanuel.jpg",
  "Voluntário": "/img/perfil_voluntario.jpg",
};

// Used only for share previews (WhatsApp/OG image) — cropped/optimized for that format.
export const WHATSAPP_FOTOS_RESPONSAVEL: Record<string, string> = {
  "Leo Felix": "/img/whatsapp_perfil_leo.jpg",
  "Ana Júlia": "/img/whatsapp_perfil_anajulia.jpg",
  "Anna Beatriz": "/img/whatsapp_perfil_annabea.jpg",
  "Dayane Prado": "/img/whatsapp_perfil_dayane.jpg",
  "Júlia Viegas": "/img/whatsapp_perfil_julia.jpg",
  "Caio Emanuel": "/img/whatsapp_perfil_caio.jpg",
  "Voluntário": "/img/whatsapp_perfil_voluntario.jpg",
};

export const WHATSAPP_FOTO_AGENCIA = "/img/whatsapp_perfil_agencia.jpg";

export const ICONES_AREA: Record<string, string> = {
  "Comunicação": "/img/icone_follow.png",
  "Hero": "/img/icone_hero.png",
  "Lagoinha Brasília": "/img/icone_lagoinha.png",
  "Missão Global": "/img/icone_missao.png",
};

export type View =
  | "dashboard"
  | "tabela"
  | "kanban"
  | "arquivadas"
  | "agenda"
  | "semanal"
  | "responsaveis"
  | "direcionar"
  | "reunioes";

export const MODALIDADES = ["Presencial", "Online"] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const PARTICIPANTES_OPCOES = ["Pr. Esdras + Agência", "Agência", "Individual", "Específico"];

export interface Assunto {
  id: string;
  reuniaoId: string;
  tema: string;
  descricao: string;
  encaminhamento: string;
  responsavel: string;
}

export interface Reuniao {
  id: string;
  data: string;
  participantes: string;
  modalidade: Modalidade;
  assuntos: Assunto[];
}

export type RedeSocial = "INSTAGRAM" | "YOUTUBE";

export interface PostSemanal {
  id: string;
  rede: RedeSocial;
  tipo: string;
  titulo: string;
  link: string;
  publicadoEm: string;
  alcance: number;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvamentos: number;
  taxaEngajamento: number;
}

export interface SnapshotSemanal {
  id: string;
  inicioSemana: string;
  fimSemana: string;
  origemDados: string;

  igSeguidores: number;
  igSeguidoresGanhos: number;
  igContasAlcancadas: number;
  igImpressoes: number;
  igVisualizacoes: number;
  igCurtidas: number;
  igComentarios: number;
  igCompartilhamentos: number;
  igSalvamentos: number;

  igStoriesPublicados: number;
  igStoriesAlcance: number;
  igStoriesImpressoes: number;
  igStoriesRespostas: number;
  igStoriesSaidas: number;
  igStoriesAvancos: number;
  igStoriesVoltas: number;

  ytInscritos: number;
  ytInscritosGanhos: number;
  ytVisualizacoes: number;
  ytImpressoes: number;
  ytCtr: number;
  ytTempoExibicaoMin: number;
  ytDuracaoMediaSeg: number;

  diagnostico: string;
  recomendacoes: string;

  posts: PostSemanal[];
  criadoEm: string;
}

export interface IntegracaoStatus {
  rede: RedeSocial;
  conectado: boolean;
  contaNome: string;
  conectadoEm: string | null;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/\s+/g, "-");
}
