import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandingsTable } from "@/components/tables/standings-table";
import { RecentMatchesList } from "@/components/home/recent-matches-list";
import { TopScorersTable } from "@/components/home/top-scorers-table";
import { CollapsibleCard } from "@/components/home/collapsible-card";

function getFormFromMatches(
  teamId: string,
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number | null;
    awayGoals: number | null;
  }[],
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

type HomePageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 6;
  const skip = (currentPage - 1) * pageSize;

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

  const [standings, recentMatches, recentMatchesCount, goalEvents] =
    await Promise.all([
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
        orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          homeGoals: true,
          awayGoals: true,
          playedAt: true,
          homeTeamId: true,
          awayTeamId: true,
          homeTeam: {
            select: {
              id: true,
              name: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
            },
          },
          events: {
            orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              type: true,
              minute: true,
              player: {
                select: {
                  id: true,
                  name: true,
                },
              },
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.match.count({
        where: {
          leagueId: league.id,
          status: "PLAYED",
        },
      }),
      prisma.matchEvent.findMany({
        where: {
          type: "GOAL",
          match: {
            leagueId: league.id,
            status: "PLAYED",
          },
        },
        select: {
          playerId: true,
          player: {
            select: {
              name: true,
              team: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const rows = standings.map((row) => {
    const teamMatches = recentMatches.filter(
      (match) =>
        match.homeTeamId === row.teamId || match.awayTeamId === row.teamId,
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

  const scorerMap = new Map<
    string,
    { playerId: string; playerName: string; teamName: string; goals: number }
  >();

  for (const event of goalEvents) {
    const existing = scorerMap.get(event.playerId);

    if (existing) {
      existing.goals += 1;
    } else {
      scorerMap.set(event.playerId, {
        playerId: event.playerId,
        playerName: event.player.name,
        teamName: event.player.team.name,
        goals: 1,
      });
    }
  }

  const scorers = Array.from(scorerMap.values()).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.playerName.localeCompare(b.playerName);
  });

  const totalPages = Math.max(1, Math.ceil(recentMatchesCount / pageSize));

  const serializedMatches = recentMatches.map((match) => ({
    id: match.id,
    playedAt: match.playedAt ? match.playedAt.toISOString() : null,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    events: match.events.map((event) => ({
      id: event.id,
      type: event.type,
      minute: event.minute,
      player: event.player,
      team: event.team,
    })),
  }));

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

      <CollapsibleCard title="Últimos partidos" defaultOpen={false}>
        <RecentMatchesList
          matches={serializedMatches}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </CollapsibleCard>

      <CollapsibleCard title="Tabla de goleadores" defaultOpen={false}>
        <TopScorersTable rows={scorers} />
      </CollapsibleCard>
    </div>
  );
}
