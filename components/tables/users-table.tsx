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

type UserRow = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  users: UserRow[];
};

export function UsersTable({ users }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que querés eliminar este usuario?");
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo eliminar el usuario");
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
            <TableHead>Username</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString("es-AR")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Link href={`/admin/users/${user.id}/edit`}>Editar</Link>
                  </Button>

                  {user.role !== "ADMIN" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={loadingId === user.id}
                    >
                      {loadingId === user.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!users.length && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                No hay usuarios cargados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}