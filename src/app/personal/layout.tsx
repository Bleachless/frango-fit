import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modo personal · Frango Fit",
  description: "Monte as fichas do aluno com carga e observações e mande por link, WhatsApp ou QR Code.",
};

export default function Layout({ children }: LayoutProps<"/personal">) {
  return children;
}
