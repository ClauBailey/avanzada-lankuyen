import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avanzada Lankuyen",
    short_name: "Lankuyen",
    description:
      "Plataforma de la Avanzada Lankuyen: progresión personal, calendario, asistencia, hojas de ruta y material de la unidad.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-CL",
    dir: "ltr",
    background_color: "#f5f6fb",
    theme_color: "#312e81",
    icons: [
      {
        src: "/brand/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
