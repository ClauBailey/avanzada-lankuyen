import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/features/auth/schemas";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    // Credentials exige JWT. La autorización real se revalida contra la base
    // de datos en cada request (ver server/auth/session.ts).
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 30,
  },
  providers: [
    Credentials({
      name: "Usuario y contraseña",
      credentials: {
        identifier: { label: "Usuario o correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const rawIdentifier = credentials?.identifier;
        const rawPassword = credentials?.password;

        const parsed = loginSchema.safeParse({
          identifier: typeof rawIdentifier === "string" ? rawIdentifier : "",
          password: typeof rawPassword === "string" ? rawPassword : "",
        });

        if (!parsed.success) return null;

        const identifier = parsed.data.identifier.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            isActive: true,
            OR: [{ username: identifier }, { email: identifier }],
          },
        });

        if (!user) return null;

        const validPassword = await verifyPassword(
          user.passwordHash,
          parsed.data.password,
        );

        if (!validPassword) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          username: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.mustChangePassword = token.mustChangePassword;
      return session;
    },
  },
});
