import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESPONSAVEIS_VISIVEIS, Tarefa, WHATSAPP_FOTOS_RESPONSAVEL, slugify } from "@/types";
import { MobilePessoaClient } from "@/components/MobilePessoaClient";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return RESPONSAVEIS_VISIVEIS.map((r) => ({ pessoa: slugify(r) }));
}

interface Props {
  params: Promise<{ pessoa: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pessoa } = await params;
  const responsavel = RESPONSAVEIS_VISIVEIS.find((r) => slugify(r) === pessoa);
  if (!responsavel) return {};

  const title = `Lista de Atividades - ${responsavel}`;
  const description = `Tarefas de ${responsavel} na Agência LBC.`;
  const foto = WHATSAPP_FOTOS_RESPONSAVEL[responsavel];

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
  const responsavel = RESPONSAVEIS_VISIVEIS.find((r) => slugify(r) === pessoa);
  if (!responsavel) notFound();

  const session = await getSession();
  if (session && (session.nivel === "RESPONSAVEL_MASTER" || session.nivel === "RESPONSAVEL_LEITURA") && session.responsavel !== responsavel) {
    redirect(`/mobile/${slugify(session.responsavel)}`);
  }

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
        <div className="mobile-header-right">
          <span className="mobile-count">{tarefas.length}</span>
          <LogoutButton className="mobile-logout-btn" />
        </div>
      </header>

      <MobilePessoaClient responsavel={responsavel} initialTarefas={tarefas as unknown as Tarefa[]} />
    </div>
  );
}
