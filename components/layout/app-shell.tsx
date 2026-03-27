import { ReactNode } from "react";

import { AppHeader } from "@/components/layout/topbar";
import { AppSidebar } from "@/components/layout/sidebar";
import { SessionRole } from "@/app/lib/navigation";

type Props = {
  children: ReactNode;
  role: SessionRole;
  isAuthenticated: boolean;
  username?: string | null;
};

export function AppShell({
  children,
  role,
  isAuthenticated,
  username,
}: Props) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <AppSidebar role={role} isAuthenticated={isAuthenticated} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            role={role}
            isAuthenticated={isAuthenticated}
            username={username}
          />

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}