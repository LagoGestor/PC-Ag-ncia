import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { IntegracoesSociaisClient } from "@/components/IntegracoesSociaisClient";

export const metadata: Metadata = {
  title: "Integrações Sociais - Agência LBC",
  robots: { index: false, follow: false },
};

export default async function IntegracoesSociaisPage() {
  const session = await getSession();
  if (!session || session.nivel !== "MASTER") {
    redirect("/");
  }

  return <IntegracoesSociaisClient />;
}
