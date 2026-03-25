"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UsersTable({ users }: any) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Eliminar usuario?")) return;

    await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user: any) => (
          <TableRow key={user.id}>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.role}</TableCell>

            <TableCell className="space-x-2">
              <Link href={`/admin/users/${user.id}/edit`}>
                <Button size="sm" variant="outline">
                  Editar
                </Button>
              </Link>

              {user.role !== "ADMIN" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(user.id)}
                >
                  Eliminar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}