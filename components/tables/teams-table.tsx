"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  budget: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  league: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
  } | null;
};

type Props = {
  teams: TeamRow[];
};

export function TeamsTable({ teams }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este equipo?",
    );
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo eliminar el equipo");
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
            <TableHead>Liga</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Presupuesto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>{team.league.name}</TableCell>
              <TableCell>{team.owner?.username ?? "Sin owner"}</TableCell>
              <TableCell>
                ${Number(team.budget).toLocaleString("es-AR")}
              </TableCell>
              <TableCell>
                <span
                  className={
                    team.isAvailable
                      ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                  }
                >
                  {team.isAvailable ? "Disponible" : "No disponible"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/teams/${team.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </Link>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(team.id)}
                    disabled={loadingId === team.id}
                  >
                    {loadingId === team.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!teams.length && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-6 text-center text-muted-foreground"
              >
                No hay equipos cargados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
