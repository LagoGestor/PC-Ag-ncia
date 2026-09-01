import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MinhaContaClient } from "@/components/MinhaContaClient";

export const metadata: Metadata = {
  title: "Alterar Senha - Agência LBC",
  robots: { index: false, follow: false },
};

const NIVEL_LABEL: Record<string, string> = {
  MASTER: "Master",
  MASTER_LEITURA: "Master Leitura",
  RESPONSAVEL_MASTER: "Responsável Master",
  RESPONSAVEL_LEITURA: "Responsável Leitura",
};

export default async function MinhaContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <MinhaContaClient
      nomeInicial={session.nome}
      loginInicial={session.login}
      nivelLabel={NIVEL_LABEL[session.nivel] ?? session.nivel}
    />
  );
}
