import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

// Status de tarefa passaram pro feminino (são "atividades"). Idempotente: sem linhas antigas, não faz nada.
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
  const a = await prisma.tarefa.updateMany({ where: { status: "Concluído" }, data: { status: "Concluída" } });
  const b = await prisma.tarefa.updateMany({ where: { status: "Cancelado" }, data: { status: "Cancelada" } });
  console.log(`Status migrados: ${a.count} Concluída, ${b.count} Cancelada`);
  await prisma.$disconnect();
}

main();
