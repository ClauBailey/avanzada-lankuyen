/**
 * Envía una notificación push de prueba a todos los dispositivos suscritos de
 * una cuenta. Sirve para validar de punta a punta el envío desde el servidor.
 *
 * Uso:
 *   npm run push:test -- <username>
 *
 * Requiere que la persona haya activado las notificaciones en /notificaciones
 * desde el navegador donde quiere recibir el aviso.
 */

import { prisma } from "../src/server/db.ts";
import { sendPushNotification } from "../src/server/web-push.ts";

const username = process.argv[2]?.trim();

if (!username) {
  console.error("Uso: npm run push:test -- <username>");
  process.exit(1);
}

const user = await prisma.user.findUnique({
  where: { username },
  select: { id: true, firstName: true },
});

if (!user) {
  console.error(`No existe una cuenta con el usuario "${username}".`);
  process.exit(1);
}

const result = await sendPushNotification(user.id, {
  title: "Prueba de notificación push",
  body: `Hola ${user.firstName}: si ves este aviso, las notificaciones push funcionan.`,
  url: "/notificaciones",
  tag: "test-push",
});

console.log("Resultado del envío:", result);

if (result.sent === 0) {
  console.log(
    "No se envió a ningún dispositivo. Activa las notificaciones en /notificaciones e inténtalo otra vez.",
  );
}

await prisma.$disconnect();
