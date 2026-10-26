import { prisma } from "./prisma";
import { agoraBRT } from "./atraso";

// Tarefa Ativa/Pendente cujo prazo (entrega + horário) já passou vira "Atrasada"; Agendada vira Concluída. Roda a cada leitura de
// tarefas — sem cron — então a lista nunca mostra uma tarefa vencida com outro status.
export async function marcarAtrasadas() {
  const { data, hora } = agoraBRT();
  await prisma.tarefa.updateMany({
    where: {
      status: { in: ["Ativa", "Pendente"] },
      arquivada: false,
      fixa: false,
      OR: [{ entrega: { not: "", lt: data } }, { entrega: data, horarioPublicacao: { not: "", lt: hora } }],
    },
    data: { status: "Atrasada" },
  });

  // "Agendada" (já programada pra ir ao ar) nunca atrasa: chegou o dia e o horário, vira Concluída.
  // Sem horário, só conclui quando o dia termina.
  await prisma.tarefa.updateMany({
    where: {
      status: "Agendada",
      arquivada: false,
      fixa: false,
      OR: [{ entrega: { not: "", lt: data } }, { entrega: data, horarioPublicacao: { not: "", lte: hora } }],
    },
    data: { status: "Concluída" },
  });
}
