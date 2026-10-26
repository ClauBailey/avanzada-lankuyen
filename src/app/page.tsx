import { redirect } from "next/navigation";

import { getCurrentUser, getLandingPath } from "@/server/auth/session";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getLandingPath(user));
}
