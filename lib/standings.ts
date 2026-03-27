import { prisma } from "@/lib/prisma";

type StandingRow = {
  teamId: string;
  leagueId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export async function recalculateLeagueStandings(leagueId: string) {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({
      where: { leagueId },
      select: { id: true, leagueId: true },
    }),
    prisma.match.findMany({
      where: {
        leagueId,
        status: "PLAYED",
      },
      orderBy: { playedAt: "asc" },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
      },
    }),
  ]);

  const table = new Map<string, StandingRow>();

  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id,
      leagueId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.homeGoals == null || match.awayGoals == null) continue;

    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;

    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeGoals < match.awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of table.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  await prisma.$transaction([
    prisma.teamStanding.deleteMany({
      where: { leagueId },
    }),
    prisma.teamStanding.createMany({
      data: Array.from(table.values()),
    }),
  ]);
}