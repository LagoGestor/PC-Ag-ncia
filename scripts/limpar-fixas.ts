import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

// Limpeza pontual pedida: apaga as atividades fixas cadastradas antes do novo campo "Periodicidade".
// O corte por data torna idempotente — fixas criadas depois disso (pelo formulário novo) não são tocadas.
const CORTE = new Date("2026-09-21T19:07:08Z");

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const r = await prisma.tarefa.deleteMany({ where: { fixa: true, createdAt: { lt: CORTE } } });
  console.log(`[limpar-fixas] ${r.count} atividade(s) fixa(s) antiga(s) removida(s).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[limpar-fixas] Erro:", err);
  process.exit(1);
});
