"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  isAuthenticated: boolean;
  username?: string;
  isAdmin: boolean;
};

export function TopHeader({ isAuthenticated, username, isAdmin }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div>
        <h1 className="text-lg font-semibold">Temporada regular</h1>
        <p className="text-sm text-muted-foreground">
          Tabla general de prueba estilo Promiedos
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Administrador" : "Usuario"}
              </p>
            </div>

            {isAdmin && (
              <Button variant="outline">
                <Link href="/admin/users">Admin</Link>
              </Button>
            )}

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