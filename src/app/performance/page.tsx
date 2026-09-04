import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PerformanceView } from "@/components/PerformanceView";

export const metadata: Metadata = {
  title: "Performance das Redes Sociais - Agência LBC",
};

export default async function PerformancePage() {
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
        {session.nivel === "MASTER" && (
          <Link href="/integracoes-sociais" className="btn btn-ghost btn-sm">
            <i className="fas fa-plug" /> Conectar contas
          </Link>
        )}
      </div>
      <PerformanceView />
    </div>
  );
}
