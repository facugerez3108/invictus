import { prisma } from "@/lib/prisma";

export async function recalculateMatchScore(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  if (!match) {
    throw new Error("Partido no encontrado");
  }

  const goals = await prisma.matchEvent.groupBy({
    by: ["teamId"],
    where: {
      matchId,
      type: "GOAL",
    },
    _count: {
      _all: true,
    },
  });

  const homeGoals =
    goals.find((g) => g.teamId === match.homeTeamId)?._count._all ?? 0;

  const awayGoals =
    goals.find((g) => g.teamId === match.awayTeamId)?._count._all ?? 0;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeGoals,
      awayGoals,
    },
  });
}