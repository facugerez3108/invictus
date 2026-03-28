import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamsTable } from "@/components/tables/teams-table";

export default async function AdminTeamsPage() {
  await requireAdmin();

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      budget: true,
      isAvailable: true,
      createdAt: true,
      updatedAt: true,
      league: {
        select: {
          id: true,
          name: true,
        },
      },
      owner: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });

  const serializedTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    avatarUrl: team.avatarUrl,
    slug: team.slug,
    budget: Number(team.budget),
    isAvailable: team.isAvailable,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    league: {
      id: team.league.id,
      name: team.league.name,
    },
    owner: team.owner
      ? {
          id: team.owner.id,
          username: team.owner.username,
          role: team.owner.role,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Equipos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná los equipos del sistema
            </p>
          </div>

          <Link href="/admin/teams/new">
            <Button>Nuevo equipo</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <TeamsTable teams={serializedTeams} />
        </CardContent>
      </Card>
    </div>
  );
}
