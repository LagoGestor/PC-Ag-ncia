import { Tarefa, TarefaInput } from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
  return res.json();
}

export const api = {
  list: (): Promise<Tarefa[]> => fetch("/api/tarefas").then((r) => json(r)),

  create: (data: TarefaInput): Promise<Tarefa> =>
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

export function nextOccurrence(diaSemana: string): string {
  const map: Record<string, number> = { Domingo: 0, Segunda: 1, "Terça": 2, Quarta: 3, Quinta: 4, Sexta: 5, "Sábado": 6 };
  const target = map[diaSemana];
  const today = new Date();
  const diff = target === undefined ? 0 : (target - today.getDay() + 7) % 7;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
