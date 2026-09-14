import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

// Fix pontual: a atividade fixa "Card Culto Hope" (Anna Beatriz) estava cadastrada errada na
// quarta-feira; deveria ser segunda. Idempotente — não faz nada se já não houver mais nenhuma
// linha em "Quarta" pra esse cadastro, então é seguro rodar mais de uma vez.
async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const resultado = await prisma.tarefa.updateMany({
    where: { fixa: true, diaSemana: "Quarta", tipo: "Card", tarefa: "Card Culto Hope", responsavel: "Anna Beatriz" },
    data: { diaSemana: "Segunda" },
  });
  console.log(`[fix-card-culto-hope] ${resultado.count} tarefa(s) movida(s) de Quarta para Segunda.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[fix-card-culto-hope] Erro:", err);
  process.exit(1);
});
