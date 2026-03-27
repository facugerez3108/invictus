"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type MatchRow = {
  id: string;
  status: "SCHEDULED" | "PLAYED" | "CANCELED";
  homeGoals: number | null;
  awayGoals: number | null;
  playedAt: string | null;
  league: {
    id: string;
    name: string;
  };
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
};

type Props = {
  matches: MatchRow[];
};

export function MatchesTable({ matches }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que querés eliminar este partido?");
    if (!confirmed) return;

    try {
      setLoadingId(id);
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo eliminar el partido");
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
            <TableHead>Liga</TableHead>
            <TableHead>Partido</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{match.league.name}</TableCell>
              <TableCell>
                {match.homeTeam.name} vs {match.awayTeam.name}
              </TableCell>
              <TableCell>
                {match.homeGoals ?? "-"} - {match.awayGoals ?? "-"}
              </TableCell>
              <TableCell>{match.status}</TableCell>
              <TableCell>
                {match.playedAt
                  ? new Date(match.playedAt).toLocaleString("es-AR")
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/matches/${match.id}/edit`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(match.id)}
                    disabled={loadingId === match.id}
                  >
                    {loadingId === match.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!matches.length && (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                No hay partidos cargados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}