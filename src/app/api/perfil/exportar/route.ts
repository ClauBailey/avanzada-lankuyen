import { NextResponse } from "next/server";

import { loadPortableProfile } from "@/features/profile/export";
import { getCurrentUser } from "@/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("No autorizado.", { status: 401 });
  }

  if (user.mustChangePassword) {
    return new Response("Debes cambiar tu contraseña inicial antes de exportar.", {
      status: 403,
    });
  }

  const profile = await loadPortableProfile(user.id);

  if (!profile) {
    return new Response("No encontramos tu perfil.", { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `perfil-${user.username}-${date}.json`;

  return new NextResponse(JSON.stringify(profile, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
