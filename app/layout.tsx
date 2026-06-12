import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melhores Momentos",
  description: "Crie uma página emocional, privada e compartilhável para presentear uma pessoa especial."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
