import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getResultLetter(match: {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
}, teamId: string): "V" | "E" | "D" {
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
}

function badgeClass(value: "V" | "E" | "D") {
  if (value === "V") return "bg-green-600 text-white";
  if (value === "E") return "bg-yellow-500 text-black";
  return "bg-red-600 text-white";
}

export default async function PanelPage() {
  const session = await requireAuth();

  const teams = await prisma.team.findMany({
    where: {
      ownerId: session.userId,
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      leagueId: true,
      league: {
        select: {
          id: true,
          name: true,
        },
      },
      standing: {
        select: {
          played: true,
          won: true,
          drawn: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          goalDifference: true,
          points: true,
        },
      },
      players: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!teams.length) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Panel del usuario</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {session.username}. Todavía no tenés un equipo asignado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamIds = teams.map((team) => team.id);

  const [recentMatches, goalEvents, yellowCards, redCards, leagueTables] =
    await Promise.all([
      prisma.match.findMany({
        where: {
          status: "PLAYED",
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
          ],
        },
        orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          leagueId: true,
          homeTeamId: true,
          awayTeamId: true,
          homeGoals: true,
          awayGoals: true,
          playedAt: true,
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
        },
      }),
      prisma.matchEvent.findMany({
        where: {
          type: "GOAL",
          teamId: { in: teamIds },
        },
        select: {
          teamId: true,
          playerId: true,
          player: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.matchEvent.count({
        where: {
          type: "YELLOW_CARD",
          teamId: { in: teamIds },
        },
      }),
      prisma.matchEvent.count({
        where: {
          type: "RED_CARD",
          teamId: { in: teamIds },
        },
      }),
      prisma.teamStanding.findMany({
        where: {
          leagueId: { in: teams.map((team) => team.leagueId) },
        },
        orderBy: [
          { points: "desc" },
          { goalDifference: "desc" },
          { goalsFor: "desc" },
          { team: { name: "asc" } },
        ],
        select: {
          teamId: true,
          leagueId: true,
        },
      }),
    ]);

  const globalGoalMap = new Map<
    string,
    { teamId: string; playerName: string; goals: number }
  >();

  for (const event of goalEvents) {
    const existing = globalGoalMap.get(event.playerId);

    if (existing) {
      existing.goals += 1;
    } else {
      globalGoalMap.set(event.playerId, {
        teamId: event.teamId,
        playerName: event.player.name,
        goals: 1,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Panel del usuario</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bienvenido, {session.username}. Acá podés ver estadísticas reales de tu equipo.
          </p>
        </CardContent>
      </Card>

      {teams.map((team) => {
        const standing = team.standing;

        const teamMatches = recentMatches.filter(
          (match) => match.homeTeamId === team.id || match.awayTeamId === team.id
        );

        const form = teamMatches
          .slice(0, 5)
          .map((match) => getResultLetter(match, team.id));

        const teamGoals = Array.from(globalGoalMap.values()).filter(
          (item) => item.teamId === team.id
        );

        const topScorer =
          teamGoals.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))[0] ??
          null;

        const leagueRows = leagueTables.filter(
          (row) => row.leagueId === team.leagueId
        );

        const position =
          leagueRows.findIndex((row) => row.teamId === team.id) + 1 || null;

        const teamYellowCards = goalEvents; // placeholder no usar
        void teamYellowCards;

        return (
          <div key={team.id} className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-3">
                    {team.avatarUrl ? (
                      <img
                        src={team.avatarUrl}
                        alt={team.name}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-bold">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div>{team.name}</div>
                      <p className="text-sm font-normal text-muted-foreground">
                        {team.league.name}
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {!standing ? (
                  <p className="text-sm text-muted-foreground">
                    Este equipo todavía no tiene standing generado.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Posición</p>
                        <p className="text-2xl font-bold">{position ?? "-"}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Puntos</p>
                        <p className="text-2xl font-bold">{standing.points}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">PJ</p>
                        <p className="text-2xl font-bold">{standing.played}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">DG</p>
                        <p className="text-2xl font-bold">
                          {standing.goalDifference > 0
                            ? `+${standing.goalDifference}`
                            : standing.goalDifference}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Ganados</p>
                        <p className="text-xl font-semibold">{standing.won}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Empatados</p>
                        <p className="text-xl font-semibold">{standing.drawn}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Perdidos</p>
                        <p className="text-xl font-semibold">{standing.lost}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Plantel activo</p>
                        <p className="text-xl font-semibold">{team.players.length}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Goles a favor</p>
                        <p className="text-xl font-semibold">{standing.goalsFor}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Goles en contra</p>
                        <p className="text-xl font-semibold">{standing.goalsAgainst}</p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Goleador</p>
                        <p className="text-sm font-semibold">
                          {topScorer ? `${topScorer.playerName} (${topScorer.goals})` : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Forma reciente</p>
                        <div className="mt-2 flex gap-1">
                          {form.length ? (
                            form.map((item, index) => (
                              <span
                                key={`${team.id}-${index}`}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${badgeClass(
                                  item
                                )}`}
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin datos</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Últimos partidos</p>

                        <div className="mt-3 space-y-2">
                          {teamMatches.slice(0, 5).length ? (
                            teamMatches.slice(0, 5).map((match) => (
                              <div
                                key={match.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>
                                  {match.homeTeam.name} vs {match.awayTeam.name}
                                </span>
                                <span className="font-medium">
                                  {match.homeGoals ?? "-"} - {match.awayGoals ?? "-"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Sin partidos jugados todavía.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">Disciplina</p>

                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Amarillas</p>
                            <p className="text-xl font-semibold">
                              {
                                prisma.matchEvent.count({
                                  where: {
                                    type: "YELLOW_CARD",
                                    teamId: team.id,
                                  },
                                })
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Rojas</p>
                            <p className="text-xl font-semibold">
                              {
                                prisma.matchEvent.count({
                                  where: {
                                    type: "RED_CARD",
                                    teamId: team.id,
                                  },
                                })
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}