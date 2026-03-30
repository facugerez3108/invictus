import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTransfersTable } from "@/components/tables/admin-transfers-table";

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

export default async function AdminTransfersPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const rawStatus = params.status ?? "PENDING";

  const allowedStatuses = [
    "PENDING",
    "COMPLETED",
    "REJECTED",
    "CANCELED",
    "APPROVED",
  ] as const;

  const status = allowedStatuses.includes(rawStatus as (typeof allowedStatuses)[number])
    ? rawStatus
    : "PENDING";

  const transfers = await prisma.transfer.findMany({
    where: {
      status: status as "PENDING" | "COMPLETED" | "REJECTED" | "CANCELED" | "APPROVED",
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
          budget: true,
          debtLimit: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          username: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  const rows = transfers.map((transfer) => {
    const amount = Number(transfer.amount);
    const currentBudget = Number(transfer.toTeam.budget);
    const debtLimit = Number(transfer.toTeam.debtLimit ?? 0);
    const projectedBudget = currentBudget - amount;
    const exceedsDebt = projectedBudget < -debtLimit;

    return {
      id: transfer.id,
      playerName: transfer.player.name,
      playerPosition: transfer.player.position,
      amount,
      status: transfer.status,
      type: transfer.type,
      notes: transfer.notes,
      createdAt: transfer.createdAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() ?? null,
      completedAt: transfer.completedAt?.toISOString() ?? null,
      rejectedAt: transfer.rejectedAt?.toISOString() ?? null,
      requestedBy: transfer.requestedBy.username,
      approvedBy: transfer.approvedBy?.username ?? null,
      from:
        transfer.fromTeam?.name ??
        transfer.fromExternalName ??
        "Origen no especificado",
      fromLeague: transfer.fromExternalLeague ?? null,
      to: transfer.toTeam.name,
      currentBudget,
      debtLimit,
      projectedBudget,
      exceedsDebt,
    };
  });

  const totalAmount = rows.reduce((acc, row) => acc + row.amount, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Panel de fichajes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Administrá solicitudes, revisá historial y procesá operaciones del mercado.
          </p>
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
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminTransfersTable rows={rows} currentStatus={status} />
    </div>
  );
}