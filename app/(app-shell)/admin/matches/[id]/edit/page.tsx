import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchForm } from "@/components/forms/match-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMatchPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const [match, leagues, teams] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        leagueId: true,
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        playedAt: true,
        status: true,
      },
    }),
    prisma.league.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, leagueId: true },
    }),
  ]);

  if (!match) notFound();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Editar partido</CardTitle>
        </CardHeader>

        <CardContent>
          <MatchForm
            mode="edit"
            leagues={leagues}
            teams={teams}
            match={{
              id: match.id,
              leagueId: match.leagueId,
              homeTeamId: match.homeTeamId,
              awayTeamId: match.awayTeamId,
              homeGoals: match.homeGoals,
              awayGoals: match.awayGoals,
              playedAt: match.playedAt ? match.playedAt.toISOString() : null,
              status: match.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}