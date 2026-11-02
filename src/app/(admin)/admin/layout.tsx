import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications } from "@/server/notifications";
import { requireReadyUser } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireReadyUser();

  // El panel es del Equipo Adulto. La coordinación entra solo a las vistas que
  // su rol habilita —hoy, la Red de Apoyo en modo consulta—; cada página del
  // panel vuelve a exigir su propio permiso.
  if (!can(user, "admin:access") && !can(user, "support_network:view")) {
    redirect("/inicio");
  }

  const unreadCount = await countUnreadNotifications(user.id);

  return (
    <AppShell user={user} variant="admin" unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
