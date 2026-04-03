import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransferForm } from "@/components/forms/transfer-form";
import { toast } from 'sonner';

export default async function NewTransferPage() {
  const session = await requireAuth();

  const ownedTeams = await prisma.team.findMany({
    where: {
      ownerId: session.userId,
    },
    select: {
      id: true,
      name: true,
      budget: true,
      debtLimit: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!ownedTeams.length) {
    redirect("/");
  }

  // por ahora tomamos el primer equipo del user
  // si después querés soportar múltiples equipos por usuario,
  // lo hacemos seleccionable
  const destinationTeam = {
    id: ownedTeams[0].id,
    name: ownedTeams[0].name,
    budget: Number(ownedTeams[0].budget),
    debtLimit: Number(ownedTeams[0].debtLimit ?? 0),
  };

  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        position: true,
        teamId: true,
        currentClubName: true,
        currentLeagueName: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.team.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        budget: true,
        debtLimit: true,
      },
    }),
  ]);

  const playerOptions = players.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    teamId: player.teamId,
    teamName: player.team?.name ?? null,
    currentClubName: player.currentClubName,
    currentLeagueName: player.currentLeagueName,
  }));

  const teamOptions = teams.map((team) => ({
    id: team.id,
    name: team.name,
    budget: Number(team.budget),
    debtLimit: Number(team.debtLimit ?? 0),
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Solicitar fichaje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Completá los datos de la operación y enviá la solicitud para revisión del administrador.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <TransferForm
            players={playerOptions}
            teams={teamOptions}
            destinationTeam={destinationTeam}
          />
        </CardContent>
      </Card>
    </div>
  );
}