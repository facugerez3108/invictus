import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerForm } from "@/components/forms/player-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPlayerPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const [player, teams] = await Promise.all([
    prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        isActive: true,
        teamId: true,
        currentClubName: true,
        currentLeagueName: true,
      },
    }),
    prisma.team.findMany({
      orderBy: [{ league: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        league: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  if (!player) notFound();

  const mappedTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    leagueName: team.league.name,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Editar jugador</CardTitle>
        </CardHeader>

        <CardContent>
          <PlayerForm
            mode="edit"
            teams={mappedTeams}
            player={{
              id: player.id,
              name: player.name,
              number: player.number,
              position: player.position,
              isActive: player.isActive,
              teamId: player.teamId,
              currentClubName: player.currentClubName,
              currentLeagueName: player.currentLeagueName,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}