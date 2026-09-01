import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar - Agência LBC",
};

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/";

  return <LoginForm nextPath={nextPath} />;
}
