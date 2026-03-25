"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Topbar() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-sm text-muted-foreground">
        Panel de administración
      </h1>

      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}