import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchEventForm } from "@/components/forms/match-event-form";
import { MatchEventsTable } from "@/components/tables/match-events-table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchEventsPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      homeTeam: {
        select: {
          id: true,
          name: true,
          players: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              teamId: true,
            },
          },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          players: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              teamId: true,
            },
          },
        },
      },
      events: {
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          type: true,
          minute: true,
          createdAt: true,
          player: {
            select: {
              id: true,
              name: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!match) notFound();

  const teams = [
    { id: match.homeTeam.id, name: match.homeTeam.name },
    { id: match.awayTeam.id, name: match.awayTeam.name },
  ];

  const players = [...match.homeTeam.players, ...match.awayTeam.players];

  const serializedEvents = match.events.map((event) => ({
    id: event.id,
    type: event.type,
    minute: event.minute,
    createdAt: event.createdAt.toISOString(),
    player: event.player,
    team: event.team,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>
            Eventos: {match.homeTeam.name} vs {match.awayTeam.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Estado del partido: {match.status}
          </p>
        </CardHeader>

        <CardContent>
          <MatchEventForm
            matchId={match.id}
            teams={teams}
            players={players}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Eventos registrados</CardTitle>
        </CardHeader>

        <CardContent>
          <MatchEventsTable events={serializedEvents} />
        </CardContent>
      </Card>
    </div>
  );
}