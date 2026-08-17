import { prisma } from "@/lib/prisma";
import { RESPONSAVEIS, slugify } from "@/types";
import { MobileTaskCard } from "@/components/MobileTaskCard";

export const dynamic = "force-dynamic";

export default async function MobileMasterPage() {
  const tarefas = await prisma.tarefa.findMany({
    where: { fixa: false, arquivada: false },
    orderBy: { entrega: "asc" },
  });

  return (
    <div className="mobile-shell">
      <header className="mobile-header">
        <div className="mobile-header-title">
          <i className="fas fa-layer-group" />
          <span>Todas as Tarefas</span>
        </div>
        <span className="mobile-count">{tarefas.length}</span>
      </header>

      <nav className="mobile-nav-chips">
        <a href="/mobile" className="mobile-chip active">
          Todos
        </a>
        {RESPONSAVEIS.map((r) => (
          <a key={r} href={`/mobile/${slugify(r)}`} className="mobile-chip">
            {r}
          </a>
        ))}
      </nav>

      <div className="mobile-list">
        {tarefas.length === 0 ? (
          <p className="mobile-empty">Nenhuma tarefa cadastrada.</p>
        ) : (
          tarefas.map((t) => <MobileTaskCard key={t.id} t={t} showResponsavel />)
        )}
      </div>
    </div>
  );
}
