import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESPONSAVEIS_VISIVEIS, RESPONSAVEL_ARMAZENAR, Tarefa, WHATSAPP_FOTO_AGENCIA, slugify } from "@/types";
import { MobilePessoaClient } from "@/components/MobilePessoaClient";
import { MobileHeaderMenu } from "@/components/MobileHeaderMenu";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const title = "Lista de Atividades - Geral";
const description = "Todas as tarefas da Agência LBC.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [{ url: WHATSAPP_FOTO_AGENCIA }] },
  twitter: { card: "summary", title, description, images: [WHATSAPP_FOTO_AGENCIA] },
};

export default async function MobileMasterPage() {
  const session = await getSession();
  if (session && session.nivel === "EXECUTOR") {
    redirect(`/mobile/${slugify(session.responsavel)}`);
  }

  const tarefas = await prisma.tarefa.findMany({
    where: { fixa: false, arquivada: false, responsavel: { not: RESPONSAVEL_ARMAZENAR } },
    orderBy: { entrega: "asc" },
  });

  return (
    <div className="mobile-shell">
      <header className="mobile-header">
        <div className="mobile-header-title">
          <i className="fas fa-layer-group" />
          <span>Todas as Tarefas</span>
        </div>
        <div className="mobile-header-right">
          <span className="mobile-count">{tarefas.length}</span>
          <MobileHeaderMenu />
        </div>
      </header>

      <nav className="mobile-nav-chips">
        <a href="/mobile" className="mobile-chip active">
          Todos
        </a>
        {RESPONSAVEIS_VISIVEIS.map((r) => (
          <a key={r} href={`/mobile/${slugify(r)}`} className="mobile-chip">
            {r}
          </a>
        ))}
      </nav>

      <MobilePessoaClient initialTarefas={tarefas as unknown as Tarefa[]} />
    </div>
  );
}
