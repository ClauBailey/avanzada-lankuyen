/**
 * Ejecuta el cron de hojas de ruta contra un servidor Next.js local.
 *
 * Uso:
 *   npm run cron:local
 *   npm run cron:local -- --bypass
 *
 * `--bypass` omite la ventana de miércoles 11:00 para demostrar el envío de
 * recordatorios en cualquier momento. Sin `--bypass` se respeta el guard real
 * y la respuesta indicará si hoy no corresponde ejecutar.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_URL ??
  "http://localhost:3000";

const secret = process.env.CRON_SECRET ?? "";
const bypass = process.argv.includes("--bypass");

if (!secret) {
  console.error(
    "Falta CRON_SECRET. Agrégalo a .env o expórtalo en la terminal.",
  );
  process.exit(1);
}

const url = new URL("/api/cron/route-sheet-reminder", baseUrl);
if (bypass) url.searchParams.set("bypassScheduleCheck", "1");

console.log(`Invocando ${url.toString()}${bypass ? " (manual)" : ""}…`);

const response = await fetch(url, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${secret}`,
    Accept: "application/json",
  },
});

const text = await response.text();

console.log(`HTTP ${response.status}`);

try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}

process.exit(response.ok ? 0 : 1);

export {};
