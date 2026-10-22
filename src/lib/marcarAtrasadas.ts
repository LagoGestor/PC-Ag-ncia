import { prisma } from "./prisma";
import { agoraBRT } from "./atraso";

// Tarefa Ativa/Pendente cujo prazo (entrega + horário) já passou vira "Atrasada". Roda a cada leitura de
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
}
