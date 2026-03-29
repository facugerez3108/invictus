import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getResultLetter(
  match: {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number | null;
    awayGoals: number | null;
  },
  teamId: string,
): "V" | "E" | "D" {
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

function formatCurrency(value: number) {
  const abs = Math.abs(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

  return value < 0 ? `- ${abs}` : abs;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
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
      budget: true,
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
              Bienvenido, {session.username}. Todavía no tenés un equipo
              asignado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamIds = teams.map((team) => team.id);
  const leagueIds = teams.map((team) => team.leagueId);

  const [
    recentMatches,
    goalEvents,
    yellowCardEvents,
    redCardEvents,
    leagueTables,
  ] = await Promise.all([
    prisma.match.findMany({
      where: {
        status: "PLAYED",
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
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
    prisma.matchEvent.findMany({
      where: {
        type: "YELLOW_CARD",
        teamId: { in: teamIds },
      },
      select: {
        teamId: true,
      },
    }),
    prisma.matchEvent.findMany({
      where: {
        type: "RED_CARD",
        teamId: { in: teamIds },
      },
      select: {
        teamId: true,
      },
    }),
    prisma.teamStanding.findMany({
      where: {
        leagueId: { in: leagueIds },
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

  const goalMap = new Map<
    string,
    { teamId: string; playerName: string; goals: number }
  >();

  for (const event of goalEvents) {
    const existing = goalMap.get(event.playerId);

    if (existing) {
      existing.goals += 1;
    } else {
      goalMap.set(event.playerId, {
        teamId: event.teamId,
        playerName: event.player.name,
        goals: 1,
      });
    }
  }

  const yellowCardsByTeam = new Map<string, number>();
  for (const event of yellowCardEvents) {
    yellowCardsByTeam.set(
      event.teamId,
      (yellowCardsByTeam.get(event.teamId) ?? 0) + 1,
    );
  }

  const redCardsByTeam = new Map<string, number>();
  for (const event of redCardEvents) {
    redCardsByTeam.set(
      event.teamId,
      (redCardsByTeam.get(event.teamId) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Panel del usuario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bienvenido, {session.username}. Acá podés ver el estado actual de
            tus equipos, su rendimiento en liga y estadísticas clave.
          </p>
        </CardHeader>
      </Card>

      {teams.map((team) => {
        const standing = team.standing;

        const teamMatches = recentMatches.filter(
          (match) =>
            match.homeTeamId === team.id || match.awayTeamId === team.id,
        );

        const form = teamMatches
          .slice(0, 5)
          .map((match) => getResultLetter(match, team.id));

        const teamGoals = Array.from(goalMap.values()).filter(
          (item) => item.teamId === team.id,
        );

        const topScorer =
          teamGoals.sort(
            (a, b) =>
              b.goals - a.goals || a.playerName.localeCompare(b.playerName),
          )[0] ?? null;

        const leagueRows = leagueTables.filter(
          (row) => row.leagueId === team.leagueId,
        );

        const position =
          leagueRows.findIndex((row) => row.teamId === team.id) + 1 || null;

        const yellowCards = yellowCardsByTeam.get(team.id) ?? 0;
        const redCards = redCardsByTeam.get(team.id) ?? 0;

        return (
          <section key={team.id} className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {team.avatarUrl ? (
                  <img
                    src={team.avatarUrl}
                    alt={team.name}
                    className="h-14 w-14 rounded-xl object-contain"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{team.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {team.league.name}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Estado financiero
                </p>
                <p
                  className={`text-2xl font-bold ${
                    Number(team.budget) < 0
                      ? "text-red-500"
                      : Number(team.budget) > 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(Number(team.budget))}
                </p>
              </div>
            </div>

            {!standing ? (
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Este equipo todavía no tiene standing generado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <SectionCard
                  title="Resumen general"
                  description="Los números principales del equipo en la temporada."
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard label="Posición" value={position ?? "-"} />
                    <MetricCard label="Puntos" value={standing.points} />
                    <MetricCard
                      label="Partidos jugados"
                      value={standing.played}
                    />
                    <MetricCard
                      label="Diferencia de gol"
                      value={
                        standing.goalDifference > 0
                          ? `+${standing.goalDifference}`
                          : standing.goalDifference
                      }
                    />
                    <MetricCard
                      label="Plantel activo"
                      value={team.players.length}
                    />
                  </div>
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard
                    title="Rendimiento en liga"
                    description="Balance general del equipo en la competencia."
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricCard label="Ganados" value={standing.won} />
                      <MetricCard label="Empatados" value={standing.drawn} />
                      <MetricCard label="Perdidos" value={standing.lost} />
                      <MetricCard
                        label="Goles a favor"
                        value={standing.goalsFor}
                      />
                      <MetricCard
                        label="Goles en contra"
                        value={standing.goalsAgainst}
                      />
                      <div className="rounded-2xl border bg-card p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Forma reciente
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {form.length ? (
                            form.map((item, index) => (
                              <span
                                key={`${team.id}-${index}`}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${badgeClass(
                                  item,
                                )}`}
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sin datos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Plantel y disciplina"
                    description="Información de jugadores, goleador y sanciones."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MetricCard
                        label="Jugadores activos"
                        value={team.players.length}
                      />
                      <MetricCard
                        label="Goleador"
                        value={
                          topScorer
                            ? `${topScorer.playerName} (${topScorer.goals})`
                            : "—"
                        }
                      />
                      <MetricCard label="Amarillas" value={yellowCards} />
                      <MetricCard label="Rojas" value={redCards} />
                    </div>
                  </SectionCard>
                </div>

                <SectionCard
                  title="Últimos partidos"
                  description="Los 5 encuentros más recientes disputados por el equipo."
                >
                  <div className="space-y-3">
                    {teamMatches.slice(0, 5).length ? (
                      teamMatches.slice(0, 5).map((match) => (
                        <div
                          key={match.id}
                          className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="text-sm">
                            <p className="font-medium">
                              {match.homeTeam.name} vs {match.awayTeam.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {match.playedAt
                                ? new Date(match.playedAt).toLocaleDateString(
                                    "es-AR",
                                  )
                                : "Fecha no disponible"}
                            </p>
                          </div>

                          <div className="text-lg font-semibold">
                            {match.homeGoals ?? "-"} - {match.awayGoals ?? "-"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin partidos jugados todavía.
                      </p>
                    )}
                  </div>
                </SectionCard>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
