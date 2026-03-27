import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamForm } from "@/components/forms/team-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTeamPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const [team, leagues, users] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        budget: true,
        isAvailable: true,
        leagueId: true,
        ownerId: true,
      },
    }),
    prisma.league.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        role: true,
      },
    }),
  ]);

  if (!team) notFound();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Editar equipo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modificá los datos del equipo.
          </p>
        </CardHeader>

        <CardContent>
          <TeamForm
            mode="edit"
            leagues={leagues}
            users={users}
            team={{
              id: team.id,
              name: team.name,
              slug: team.slug,
              budget: Number(team.budget),
              isAvailable: team.isAvailable,
              leagueId: team.leagueId,
              ownerId: team.ownerId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}