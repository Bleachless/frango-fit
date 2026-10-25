import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sua ficha do personal · Frango Fit",
  description: "Abra e adicione as fichas do seu personal no Frango Fit com um toque.",
};

export default function Layout({ children }: LayoutProps<"/aluno">) {
  return children;
}
