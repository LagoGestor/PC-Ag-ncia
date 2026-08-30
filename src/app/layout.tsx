import type { Metadata } from "next";
import "./globals.css";

const title = "Gestor de Tarefas";
const description = "Gestão de tarefas da agência";
const shareImage = "/img/whatsapp_perfil_agencialbc.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://agencialbc.vercel.app"),
  title,
  description,
  openGraph: { title, description, images: [{ url: shareImage }] },
  twitter: { card: "summary", title, description, images: [shareImage] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
      <body>{children}</body>
    </html>
  );
}
