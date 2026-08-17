import { Tarefa } from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
  return res.json();
}

export const api = {
  list: (): Promise<Tarefa[]> => fetch("/api/tarefas").then((r) => json(r)),

  create: (data: Omit<Tarefa, "id" | "arquivada" | "fixa" | "diaSemana">): Promise<Tarefa> =>
    fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json(r)),

  update: (id: string, data: Partial<Tarefa>): Promise<Tarefa> =>
    fetch(`/api/tarefas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json(r)),

  remove: (id: string): Promise<void> =>
    fetch(`/api/tarefas/${id}`, { method: "DELETE" }).then(() => undefined),
};
