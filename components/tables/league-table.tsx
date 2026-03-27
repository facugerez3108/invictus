"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type LeagueRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  leagues: LeagueRow[];
};

export function LeaguesTable({ leagues }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleActive(league: LeagueRow) {
    try {
      setLoadingId(league.id);

      const res = await fetch(`/api/leagues/${league.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !league.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo actualizar el estado");
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
            <TableHead>Slug</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {leagues.map((league) => (
            <TableRow key={league.id}>
              <TableCell className="font-medium">{league.name}</TableCell>
              <TableCell>{league.slug}</TableCell>
              <TableCell>
                <span
                  className={
                    league.isActive
                      ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                  }
                >
                  {league.isActive ? "Activa" : "Inactiva"}
                </span>
              </TableCell>
              <TableCell>
                {new Date(league.createdAt).toLocaleDateString("es-AR")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Link href={`/admin/leagues/${league.id}/edit`}>Editar</Link>
                  </Button>

                  <Button
                    variant={league.isActive ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => toggleActive(league)}
                    disabled={loadingId === league.id}
                  >
                    {loadingId === league.id
                      ? "Guardando..."
                      : league.isActive
                      ? "Desactivar"
                      : "Activar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!leagues.length && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                No hay ligas cargadas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}