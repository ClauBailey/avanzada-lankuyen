import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications } from "@/server/notifications";
import { requirePermission } from "@/server/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("admin:access");
  const unreadCount = await countUnreadNotifications(user.id);

  return (
    <AppShell user={user} variant="admin" unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
