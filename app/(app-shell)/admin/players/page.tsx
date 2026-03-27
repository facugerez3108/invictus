import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayersTable } from "@/components/tables/players-table";

export default async function AdminPlayersPage() {
  await requireAdmin();

  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      number: true,
      position: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      team: {
        select: {
          id: true,
          name: true,
          league: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const serializedPlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    number: player.number,
    position: player.position,
    isActive: player.isActive,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    team: {
      id: player.team.id,
      name: player.team.name,
      league: {
        id: player.team.league.id,
        name: player.team.league.name,
      },
    },
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Jugadores</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná los jugadores del sistema
            </p>
          </div>

          <Link href="/admin/players/new">
            <Button>Nuevo jugador</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <PlayersTable players={serializedPlayers} />
        </CardContent>
      </Card>
    </div>
  );
}