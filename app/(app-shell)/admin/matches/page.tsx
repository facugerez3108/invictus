import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchesTable } from "@/components/tables/matches-table";

export default async function AdminMatchesPage() {
  await requireAdmin();

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      homeGoals: true,
      awayGoals: true,
      playedAt: true,
      league: { select: { id: true, name: true } },
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  const serializedMatches = matches.map((match) => ({
    ...match,
    playedAt: match.playedAt ? match.playedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Partidos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná los partidos del sistema
            </p>
          </div>

          <Link href="/admin/matches/new">
            <Button>Nuevo partido</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <MatchesTable matches={serializedMatches} />
        </CardContent>
      </Card>
    </div>
  );
}