import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las Hojas de Ruta y justificaciones se subirán por Server Actions.
      bodySizeLimit: "16mb",
    },
  },
  serverExternalPackages: ["@node-rs/argon2", "@prisma/adapter-pg", "pg", "web-push"],
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Escucha `push` y `notificationclick` desde worker/index.ts.
  customWorkerSrc: "worker",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        // Las respuestas de la API dependen de la sesión y pueden contener
        // datos privados (fotos de La Bitácora, sesión, etc.). Nunca deben
        // quedar guardadas en la caché del Service Worker.
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
    ],
  },
});

export default withPWA(nextConfig);
