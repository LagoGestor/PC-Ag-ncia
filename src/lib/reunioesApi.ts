import { Assunto, Reuniao } from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
  return res.json();
}

export const reunioesApi = {
  list: (): Promise<Reuniao[]> => fetch("/api/reunioes").then((r) => json(r)),

  create: (data: { data: string; participantes: string; modalidade: string }): Promise<Reuniao> =>
    fetch("/api/reunioes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json(r)),
};

export const assuntosApi = {
  create: (data: {
    reuniaoId: string;
    tema: string;
    descricao: string;
    encaminhamento: string;
    responsavel: string;
  }): Promise<Assunto> =>
    fetch("/api/assuntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json(r)),
};
