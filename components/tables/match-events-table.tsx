"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
  createdAt: string;
};

type Props = {
  events: MatchEventRow[];
};

function labelByType(type: MatchEventRow["type"]) {
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

export function MatchEventsTable({ events }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que querés eliminar este evento?");
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/match-events/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo eliminar el evento");
        return;
      }

      router.refresh();
    } catch {
      alert("Ocurrió un error inesperado");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Min</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.minute}'</TableCell>
              <TableCell>{labelByType(event.type)}</TableCell>
              <TableCell>{event.player.name}</TableCell>
              <TableCell>{event.team.name}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                  disabled={loadingId === event.id}
                >
                  {loadingId === event.id ? "Eliminando..." : "Eliminar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {!events.length && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                No hay eventos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}