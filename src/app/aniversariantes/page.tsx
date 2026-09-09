import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AniversariantesView } from "@/components/AniversariantesView";

export const metadata: Metadata = {
  title: "Aniversariantes - Agência LBC",
};

export default async function AniversariantesPage() {
  const session = await getSession();
  if (!session || (session.nivel !== "MASTER" && session.nivel !== "DIRETOR_CONTEUDO")) {
    redirect("/");
  }

  const voltarPara = session.nivel === "MASTER" ? "/" : "/mobile";

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
