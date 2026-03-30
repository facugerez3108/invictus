import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTransfersTable } from "@/components/tables/user-transfers-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
}

export default async function UserTransfersPage({ searchParams }: PageProps) {
  const session = await requireAuth();
  const params = (await searchParams) ?? {};
  const rawStatus = params.status ?? "PENDING";

  const allowedStatuses = [
    "PENDING",
    "COMPLETED",
    "REJECTED",
    "CANCELED",
    "APPROVED",
  ] as const;

  const status = allowedStatuses.includes(
    rawStatus as (typeof allowedStatuses)[number],
  )
    ? rawStatus
    : "PENDING";

  const transfers = await prisma.transfer.findMany({
    where: {
      requestedById: session.userId,
      status: status as
        | "PENDING"
        | "COMPLETED"
        | "REJECTED"
        | "CANCELED"
        | "APPROVED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      type: true,
      notes: true,
      createdAt: true,
      approvedAt: true,
      completedAt: true,
      rejectedAt: true,
      fromExternalName: true,
      fromExternalLeague: true,
      player: {
        select: {
          id: true,
          name: true,
          position: true,
        },
      },
      fromTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      toTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      approvedBy: {
        select: {
          username: true,
        },
      },
    },
  });

  const rows = transfers.map((transfer) => ({
    id: transfer.id,
    playerName: transfer.player.name,
    playerPosition: transfer.player.position,
    amount: Number(transfer.amount),
    status: transfer.status,
    type: transfer.type,
    notes: transfer.notes,
    createdAt: transfer.createdAt.toISOString(),
    approvedAt: transfer.approvedAt?.toISOString() ?? null,
    completedAt: transfer.completedAt?.toISOString() ?? null,
    rejectedAt: transfer.rejectedAt?.toISOString() ?? null,
    approvedBy: transfer.approvedBy?.username ?? null,
    from:
      transfer.fromTeam?.name ??
      transfer.fromExternalName ??
      "Origen no especificado",
    fromLeague: transfer.fromExternalLeague ?? null,
    to: transfer.toTeam.name,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Mis fichajes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Consultá tus solicitudes enviadas, su estado y el historial de
            decisiones.
          </p>

          <Button className="mt-2 cursor-pointer">
            <Link href="/fichajes/new">Nuevo fichaje</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Estado actual
            </p>
            <p className="mt-2 text-2xl font-semibold">{status}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Registros
            </p>
            <p className="mt-2 text-2xl font-semibold">{rows.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Monto total
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(rows.reduce((acc, row) => acc + row.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <UserTransfersTable rows={rows} currentStatus={status} />
    </div>
  );
}
