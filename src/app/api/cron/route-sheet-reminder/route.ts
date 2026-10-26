import { revalidatePath } from "next/cache";

import { runRouteSheetReminder } from "@/server/cron/route-sheet-reminder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readBypass(request: Request) {
  const value = new URL(request.url).searchParams
    .get("bypassScheduleCheck")
    ?.toLowerCase();

  return value === "1" || value === "true" || value === "yes";
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET no está configurado en el servidor." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";

  if (authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await runRouteSheetReminder({
    bypassScheduleCheck: readBypass(request),
  });

  if (result.executed && result.stats.notifications > 0) {
    revalidatePath("/notificaciones");
    revalidatePath("/hojas-de-ruta");
    revalidatePath("/admin/hojas-de-ruta");
    revalidatePath("/", "layout");
  }

  return Response.json(result, { status: result.error ? 500 : 200 });
}

export const GET = handle;
export const POST = handle;
