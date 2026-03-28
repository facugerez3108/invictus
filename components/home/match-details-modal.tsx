"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MatchEvent = {
  id: string;
  type: "GOAL" | "YELLOW_CARD" | "RED_CARD";
  minute: number;
  player: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
};

type Props = {
  match: {
    id: string;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
    homeGoals: number | null;
    awayGoals: number | null;
    events: MatchEvent[];
  };
};

function getIcon(type: MatchEvent["type"]) {
  switch (type) {
    case "GOAL":
      return "⚽";
    case "YELLOW_CARD":
      return "🟨";
    case "RED_CARD":
      return "🟥";
    default:
      return "";
  }
}

export function MatchDetailsModal({ match }: Props) {
  const homeEvents = match.events
    .filter((e) => e.team.id === match.homeTeam.id)
    .sort((a, b) => a.minute - b.minute);

  const awayEvents = match.events.filter(
    (e) => e.team.id === match.awayTeam.id,
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Ver detalles
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {match.homeTeam.name} {match.homeGoals ?? "-"} -{" "}
            {match.awayGoals ?? "-"} {match.awayTeam.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* HOME */}
          <div>
            <h3 className="mb-3 font-semibold">{match.homeTeam.name}</h3>

            {homeEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos</p>
            ) : (
              <div className="space-y-2">
                {homeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{getIcon(event.type)}</span>
                    <span className="font-medium">{event.player.name}</span>
                    <span className="text-muted-foreground">
                      {event.minute}'
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AWAY */}
          <div>
            <h3 className="mb-3 font-semibold">{match.awayTeam.name}</h3>

            {awayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos</p>
            ) : (
              <div className="space-y-2">
                {awayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{getIcon(event.type)}</span>
                    <span className="font-medium">{event.player.name}</span>
                    <span className="text-muted-foreground">
                      {event.minute}'
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
