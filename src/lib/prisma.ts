import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
// Evita reaproveitar uma conexão WebSocket que ficou obsoleta entre invocações da função
// serverless (suspeita da causa das leituras de senha "desatualizadas" relatadas): cada
// consulta do Pool vira uma requisição HTTP independente, sem estado de conexão para expirar.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
