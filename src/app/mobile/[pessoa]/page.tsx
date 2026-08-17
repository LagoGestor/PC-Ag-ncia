import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESPONSAVEIS, FOTOS_RESPONSAVEL, slugify } from "@/types";
import { MobileTaskCard } from "@/components/MobileTaskCard";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return RESPONSAVEIS.map((r) => ({ pessoa: slugify(r) }));
}

interface Props {
  params: Promise<{ pessoa: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pessoa } = await params;
  const responsavel = RESPONSAVEIS.find((r) => slugify(r) === pessoa);
  if (!responsavel) return {};

  const title = `Lista de Atividades - ${responsavel}`;
  const description = `Tarefas de ${responsavel} na Agência LBC.`;
  const foto = FOTOS_RESPONSAVEL[responsavel];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: foto ? [{ url: foto }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function MobilePessoaPage({ params }: Props) {
  const { pessoa } = await params;
  const responsavel = RESPONSAVEIS.find((r) => slugify(r) === pessoa);
  if (!responsavel) notFound();

  const tarefas = await prisma.tarefa.findMany({
    where: { fixa: false, arquivada: false, responsavel },
    orderBy: { entrega: "asc" },
  });

  return (
    <div className="mobile-shell">
      <header className="mobile-header mobile-header-solo">
        <div className="mobile-header-title">
          <Avatar name={responsavel} size={52} />
          <span>{responsavel}</span>
        </div>
        <span className="mobile-count">{tarefas.length}</span>
      </header>

      <div className="mobile-list">
        {tarefas.length === 0 ? (
          <p className="mobile-empty">Nenhuma tarefa para {responsavel} no momento.</p>
        ) : (
          tarefas.map((t) => <MobileTaskCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  );
}
