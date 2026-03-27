import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/tables/users-table";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná los usuarios del sistema
            </p>
          </div>

          <Button>
            <Link href="/admin/users/new">Nuevo usuario</Link>
          </Button>
        </CardHeader>

        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}