import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";

export default async function MainAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  return (
    <AppShell
      role={session?.role ?? null}
      isAuthenticated={!!session}
      username={session?.username ?? null}
    >
      {children}
    </AppShell>
  );
}