import type { MetadataRoute } from "next";

// Permite instalar o app na tela inicial do celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frango Fit",
    short_name: "Frango Fit",
    description: "Ficha de treino e carga progressiva com um Frango que evolui junto com você.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0e0c",
    theme_color: "#0d0e0c",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
