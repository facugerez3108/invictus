import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Editar usuario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modificá username, contraseña y rol del usuario.
          </p>
        </CardHeader>

        <CardContent>
          <UserForm
            mode="edit"
            user={{
              id: user.id,
              username: user.username,
              role: user.role,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}