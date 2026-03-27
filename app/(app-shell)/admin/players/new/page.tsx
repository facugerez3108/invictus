import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerForm } from "@/components/forms/player-form";

export default async function NewPlayerPage() {
  await requireAdmin();

  const teams = await prisma.team.findMany({
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
  });

  const mappedTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    leagueName: team.league.name,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Nuevo jugador</CardTitle>
        </CardHeader>

        <CardContent>
          <PlayerForm mode="create" teams={mappedTeams} />
        </CardContent>
      </Card>
    </div>
  );
}