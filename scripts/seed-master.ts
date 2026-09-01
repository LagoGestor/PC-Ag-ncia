import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

neonConfig.webSocketConstructor = ws;

const NOME_INICIAL = "Leo Felix";
const LOGIN_INICIAL = "leo.felix";
const SENHA_INICIAL = "*lfa1234";

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existente = await prisma.usuario.findUnique({ where: { login: LOGIN_INICIAL } });
  if (existente) {
    console.log(`[seed-master] Login "${LOGIN_INICIAL}" já existe, nada a fazer.`);
  } else {
    const senhaHash = await hashPassword(SENHA_INICIAL);
    await prisma.usuario.create({
      data: { nome: NOME_INICIAL, login: LOGIN_INICIAL, senhaHash, nivel: "MASTER", responsavel: "" },
    });
    console.log(`[seed-master] Login Master "${LOGIN_INICIAL}" criado.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-master] Erro ao semear login master:", err);
  process.exit(1);
});
