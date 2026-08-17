-- CreateTable
CREATE TABLE "Tarefa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarefa" TEXT NOT NULL,
    "area" TEXT NOT NULL,
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
