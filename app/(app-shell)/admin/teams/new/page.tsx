import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamForm } from "@/components/forms/team-form";

export default async function NewTeamPage() {
  await requireAdmin();

  const [leagues, users] = await Promise.all([
    prisma.league.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        role: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Nuevo equipo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Creá un nuevo equipo y asignalo a una liga.
          </p>
        </CardHeader>

        <CardContent>
          <TeamForm mode="create" leagues={leagues} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}