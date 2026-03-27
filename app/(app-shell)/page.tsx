import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandingsTable } from "@/components/tables/standings-table";

function getFormFromMatches(
  teamId: string,
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number | null;
    awayGoals: number | null;
  }[]
): ("V" | "E" | "D")[] {
  return matches.slice(0, 5).map((match) => {
    if (match.homeGoals == null || match.awayGoals == null) return "E";

    const isHome = match.homeTeamId === teamId;

    if (isHome) {
      if (match.homeGoals > match.awayGoals) return "V";
      if (match.homeGoals < match.awayGoals) return "D";
      return "E";
    }

    if (match.awayGoals > match.homeGoals) return "V";
    if (match.awayGoals < match.homeGoals) return "D";
    return "E";
  });
}

export default async function HomePage() {
  const league = await prisma.league.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  if (!league) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Tabla general</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay ligas activas cargadas todavía.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [standings, recentMatches] = await Promise.all([
    prisma.teamStanding.findMany({
      where: { leagueId: league.id },
      orderBy: [
        { points: "desc" },
        { goalDifference: "desc" },
        { goalsFor: "desc" },
        { team: { name: "asc" } },
      ],
      select: {
        teamId: true,
        played: true,
        won: true,
        drawn: true,
        lost: true,
        goalsFor: true,
        goalsAgainst: true,
        goalDifference: true,
        points: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.match.findMany({
      where: {
        leagueId: league.id,
        status: "PLAYED",
      },
      orderBy: { playedAt: "desc" },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
      },
    }),
  ]);

  const rows = standings.map((row) => {
    const teamMatches = recentMatches.filter(
      (match) => match.homeTeamId === row.teamId || match.awayTeamId === row.teamId
    );

    return {
      teamId: row.teamId,
      teamName: row.team.name,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
      form: getFormFromMatches(row.teamId, teamMatches),
    };
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{league.name}</CardTitle>
        </CardHeader>

        <CardContent>
          <StandingsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}