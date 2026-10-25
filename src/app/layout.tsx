import type { Metadata, Viewport } from "next";
import { Anton, Silkscreen, Space_Grotesk } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });
const silk = Silkscreen({ variable: "--font-silk", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frango Fit · ficha de treino e carga progressiva",
  description:
    "Ficha de treino, registro de séries e carga progressiva com um Frango que evolui junto com você. Funciona offline, sem login.",
  applicationName: "Frango Fit",
  appleWebApp: { capable: true, title: "Frango Fit", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0e0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${grotesk.variable} ${silk.variable} antialiased`}>
      <body className="min-h-screen overflow-x-hidden font-sans text-chalk">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
