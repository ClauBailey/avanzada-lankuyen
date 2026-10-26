import { AppShell } from "@/components/layout/app-shell";
import { countUnreadNotifications } from "@/server/notifications";
import { requireReadyUser } from "@/server/auth/session";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireReadyUser();
  const unreadCount = await countUnreadNotifications(user.id);

  return (
    <AppShell user={user} variant="member" unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
