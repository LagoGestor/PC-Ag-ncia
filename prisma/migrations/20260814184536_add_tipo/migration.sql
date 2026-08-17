-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarefa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarefa" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT '',
    "responsavel" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "solicitacao" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '',
    "entrega" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tarefa" ("area", "arquivada", "createdAt", "descricao", "entrega", "feedback", "id", "responsavel", "solicitacao", "status", "tarefa", "updatedAt") SELECT "area", "arquivada", "createdAt", "descricao", "entrega", "feedback", "id", "responsavel", "solicitacao", "status", "tarefa", "updatedAt" FROM "Tarefa";
DROP TABLE "Tarefa";
ALTER TABLE "new_Tarefa" RENAME TO "Tarefa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
