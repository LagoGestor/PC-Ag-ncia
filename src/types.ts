export type Status = "Ativa" | "Pendente" | "Atrasada" | "Concluído" | "Cancelado";

export interface Tarefa {
  id: string;
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  status: Status;
  arquivada: boolean;
  fixa: boolean;
  diaSemana: string;
}

export const AREAS = ["Comunicação", "Hero", "Lagoinha", "Missão Global"];

export const TIPOS = [
  "Post",
  "Reels",
  "Story",
  "VOD",
  "Wathsapp",
  "Gráfica",
  "LED",
  "Site",
  "PPT",
  "PDF",
  "Thumbnail",
  "Fotografia",
  "Documentação",
  "Outro",
];

export const RESPONSAVEIS = [
  "Leonardo Felix",
  "Ana Júlia",
  "Anna Beatriz",
  "Júlia Viegas",
  "Dayane Prado",
  "Voluntário",
];

export const STATUSES: Status[] = ["Ativa", "Pendente", "Atrasada", "Concluído", "Cancelado"];

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const STATUS_COLORS: Record<string, string> = {
  Ativa: "#4ade80",
  Pendente: "#fbbf24",
  Atrasada: "#f87171",
  Concluído: "#38bdf8",
  Cancelado: "#6b7280",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  Ativa: "badge-ativa",
  Pendente: "badge-pendente",
  Atrasada: "badge-atrasada",
  Concluído: "badge-concluido",
  Cancelado: "badge-cancelado",
};

export const FOTOS_RESPONSAVEL: Record<string, string> = {
  "Leonardo Felix": "/img/perfil_leo.jpg",
  "Ana Júlia": "/img/perfil_anajulia.jpg",
  "Anna Beatriz": "/img/perfil_annabea.jpg",
  "Dayane Prado": "/img/perfil_dayane.jpg",
  "Júlia Viegas": "/img/perfil_julia.jpg",
  "Voluntário": "/img/perfil_voluntario.jpg",
};

export const ICONES_AREA: Record<string, string> = {
  "Comunicação": "/img/icone_follow.png",
  "Hero": "/img/icone_hero.png",
  "Lagoinha": "/img/icone_lagoinha.png",
  "Missão Global": "/img/icone_missao.png",
};

export type View = "dashboard" | "tabela" | "kanban" | "arquivadas" | "agenda" | "semanal" | "responsaveis";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/\s+/g, "-");
}
