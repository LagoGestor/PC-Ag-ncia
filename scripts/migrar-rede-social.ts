import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const MIGRACAO = "rede-social-instagram-v1";
// Os mesmos tipos que, antes do campo "Rede Social", formavam o "Cronograma de Postagens no Instagram".
const TIPOS_INSTAGRAM = ["Card", "Carrossel Design", "Carrossel Simples", "Reels", "Story", "Post"];

// Roda uma vez só (marcada na tabela Migracao): tarefas e atividades fixas desses tipos, ainda sem rede social,
// passam a ser Instagram — assim não somem da Agenda depois que o filtro passou a olhar a Rede Social.
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
  if (await prisma.migracao.findUnique({ where: { id: MIGRACAO } })) {
    await prisma.$disconnect();
    return;
  }
  const r = await prisma.tarefa.updateMany({ where: { redeSocial: "", tipo: { in: TIPOS_INSTAGRAM } }, data: { redeSocial: "Instagram" } });
  await prisma.migracao.create({ data: { id: MIGRACAO } });
  console.log(`Rede social migrada: ${r.count} tarefa(s) marcadas como Instagram`);
  await prisma.$disconnect();
}

main();
