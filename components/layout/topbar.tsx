"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SessionRole } from "@/app/lib/navigation";

type Props = {
  role: SessionRole;
  isAuthenticated: boolean;
  username?: string | null;
};

export function AppHeader({ role, isAuthenticated, username }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar role={role} isAuthenticated={isAuthenticated} />

        <div>
          <h1 className="text-base font-semibold md:text-lg">
            Liga EAFC 26
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Temporada regular y gestión de liga
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">
                {role === "ADMIN" ? "Administrador" : "Usuario"}
              </p>
            </div>

            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}