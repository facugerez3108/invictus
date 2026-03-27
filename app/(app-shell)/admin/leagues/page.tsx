import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaguesTable } from "@/components/tables/league-table";

export default async function AdminLeaguesPage() {
  await requireAdmin();

  const leagues = await prisma.league.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Ligas</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná las ligas del sistema
            </p>
          </div>

          <Button>
            <Link href="/admin/leagues/new">Nueva liga</Link>
          </Button>
        </CardHeader>

        <CardContent>
          <LeaguesTable leagues={leagues} />
        </CardContent>
      </Card>
    </div>
  );
}