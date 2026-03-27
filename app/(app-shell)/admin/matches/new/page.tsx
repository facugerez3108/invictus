import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchForm } from "@/components/forms/match-form";

export default async function NewMatchPage() {
  await requireAdmin();

  const [leagues, teams] = await Promise.all([
    prisma.league.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, leagueId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Nuevo partido</CardTitle>
        </CardHeader>

        <CardContent>
          <MatchForm mode="create" leagues={leagues} teams={teams} />
        </CardContent>
      </Card>
    </div>
  );
}