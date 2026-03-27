import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeagueForm } from "@/components/forms/league-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLeaguePage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  });

  if (!league) notFound();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Editar liga</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modificá los datos de la liga
          </p>
        </CardHeader>

        <CardContent>
          <LeagueForm
            mode="edit"
            league={{
              id: league.id,
              name: league.name,
              slug: league.slug,
              isActive: league.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}