"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type PlayerRow = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
    league: {
      id: string;
      name: string;
    };
  };
};

type Props = {
  players: PlayerRow[];
};

export function PlayersTable({ players }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que querés eliminar este jugador?");
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/players/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo eliminar el jugador");
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
            <TableHead>Nombre</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Posición</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Liga</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.number ?? "-"}</TableCell>
              <TableCell>{player.position ?? "-"}</TableCell>
              <TableCell>{player.team.name}</TableCell>
              <TableCell>{player.team.league.name}</TableCell>
              <TableCell>
                <span
                  className={
                    player.isActive
                      ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                  }
                >
                  {player.isActive ? "Activo" : "Inactivo"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/players/${player.id}/edit`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(player.id)}
                    disabled={loadingId === player.id}
                  >
                    {loadingId === player.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!players.length && (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                No hay jugadores cargados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}