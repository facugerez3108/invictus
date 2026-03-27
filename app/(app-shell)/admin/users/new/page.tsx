import * as React from "react";

import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Crear nuevo usuario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Creá una nueva cuenta de tipo USER para la liga.
          </p>
        </CardHeader>

        <CardContent>
          <UserForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}