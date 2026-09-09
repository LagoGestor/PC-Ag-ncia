import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AniversariantesView } from "@/components/AniversariantesView";
import { AppTopbar } from "@/components/AppTopbar";
import { slugify } from "@/types";

export const metadata: Metadata = {
  title: "Aniversariantes - Agência LBC",
};

export default async function AniversariantesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Master e Diretor têm a mesma topbar do resto da ferramenta; Executor (que só conhece a
  // casca mobile) mantém uma barra simples só com "Voltar".
  const desktop = session.nivel === "MASTER" || session.nivel === "DIRETOR_CONTEUDO";
  const voltarPara =
    session.nivel === "MASTER"
      ? "/"
      : session.nivel === "EXECUTOR"
        ? `/mobile/${slugify(session.responsavel)}`
        : "/mobile";

  if (desktop) {
    return (
      <div className="app-page-shell">
        <AppTopbar />
        <div className="app-page-content">
          <AniversariantesView />
        </div>
      </div>
    );
  }

  return (
    <div className="performance-page-shell">
      <div className="performance-page-topbar">
        <Link href={voltarPara} className="btn btn-ghost btn-sm">
          <i className="fas fa-arrow-left" /> Voltar
        </Link>
      </div>
      <AniversariantesView />
    </div>
  );
}
