import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { PwaRegister } from "@/components/PwaRegister";

const title = "Gestor de Tarefas";
const description = "Gestão de tarefas da agência";
const shareImage = "/img/whatsapp_perfil_agencialbc.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://agencialbc.vercel.app"),
  title,
  description,
  openGraph: { title, description, images: [{ url: shareImage }] },
  twitter: { card: "summary", title, description, images: [shareImage] },
  appleWebApp: { capable: true, title: "Agência LBC", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#080c0a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const clientSession = session
    ? { nome: session.nome, login: session.login, nivel: session.nivel, responsavel: session.responsavel }
    : null;

  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider session={clientSession}>{children}</SessionProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
