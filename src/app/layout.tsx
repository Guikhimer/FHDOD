import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Sua opinião importa | FHDOD", template: "%s | FHDOD" },
  description: "Pesquisa de satisfação da Fundação Hospitalar Dr. Oswaldo Diesel.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
