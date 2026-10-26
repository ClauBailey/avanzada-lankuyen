import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las Hojas de Ruta y justificaciones se subirán por Server Actions.
      bodySizeLimit: "16mb",
    },
  },
  serverExternalPackages: ["@node-rs/argon2", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
