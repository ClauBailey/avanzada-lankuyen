import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // En CLI se prefiere la conexión directa (Neon/Supabase) si existe.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
