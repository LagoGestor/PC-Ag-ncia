import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CadastrarLoginClient } from "@/components/CadastrarLoginClient";

export const metadata: Metadata = {
  title: "Cadastrar Login - Agência LBC",
  robots: { index: false, follow: false },
};

export default async function CadastrarLoginPage() {
  const session = await getSession();
  if (!session || session.nivel !== "MASTER") {
    redirect("/");
  }

  return <CadastrarLoginClient />;
}
