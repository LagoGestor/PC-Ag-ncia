import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESPONSAVEIS_VISIVEIS, Tarefa, WHATSAPP_FOTOS_RESPONSAVEL, slugify } from "@/types";
import { MobilePessoaClient } from "@/components/MobilePessoaClient";
import { Avatar } from "@/components/Avatar";
import { MobileHeaderMenu } from "@/components/MobileHeaderMenu";
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

  // Sem sessão chega aqui só pelo crawler de preview do WhatsApp/Facebook (o proxy deixa passar
  // essa rota sem cookie de propósito, pra pegar a metadata certa) ou por um visitante real sem
  // login — nos dois casos, mostra um cartão de entrar em vez das tarefas de verdade.
  if (!session) {
    return (
      <div className="login-shell">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="login-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/icone_logo_agencia.png" alt="Agência LBC" />
            <span>Agência LBC</span>
          </div>
          <p style={{ margin: "12px 0 20px", color: "var(--fg-muted)" }}>
            Entre para ver a lista de tarefas de {responsavel}.
          </p>
          <Link href={`/login?next=/mobile/${pessoa}`} className="btn btn-accent login-submit">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  if (session.nivel === "EXECUTOR" && session.responsavel !== responsavel) {
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
          <MobileHeaderMenu />
        </div>
      </header>

      <MobilePessoaClient responsavel={responsavel} initialTarefas={tarefas as unknown as Tarefa[]} />
    </div>
  );
}
