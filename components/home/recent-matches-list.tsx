"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MatchDetailsModal } from "./match-details-modal";

type MatchEventRow = {
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

type MatchRow = {
  id: string;
  playedAt: string | null;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  homeGoals: number | null;
  awayGoals: number | null;
  events: MatchEventRow[];
};

type Props = {
  matches: MatchRow[];
  currentPage: number;
  totalPages: number;
};

function eventLabel(type: MatchEventRow["type"]) {
  switch (type) {
    case "GOAL":
      return "Gol";
    case "YELLOW_CARD":
      return "Amarilla";
    case "RED_CARD":
      return "Roja";
    default:
      return type;
  }
}

export function RecentMatchesList({
  matches,
  currentPage,
  totalPages,
}: Props) {
  
  return (
    <div className="space-y-4">
      {!matches.length ? (
        <p className="text-sm text-muted-foreground">
          No hay partidos jugados registrados todavía.
        </p>
      ) : (
        matches.map((match) => {


          return (
            <div key={match.id} className="rounded-xl border">
              <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold">
                    {match.homeTeam.name} {match.homeGoals ?? "-"} -{" "}
                    {match.awayGoals ?? "-"} {match.awayTeam.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {match.playedAt
                      ? new Date(match.playedAt).toLocaleString("es-AR")
                      : "Sin fecha"}
                  </p>
                </div>

                <MatchDetailsModal match={match} />
              </div>
            </div>
          );
        })
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link href={`/?page=${Math.max(1, currentPage - 1)}`}>
            <Button variant="outline" disabled={currentPage === 1}>
              Anterior
            </Button>
          </Link>

          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>

          <Link href={`/?page=${Math.min(totalPages, currentPage + 1)}`}>
            <Button variant="outline" disabled={currentPage === totalPages}>
              Siguiente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}