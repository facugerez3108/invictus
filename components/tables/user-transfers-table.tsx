"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type TransferStatus = "PENDING" | "COMPLETED" | "REJECTED" | "CANCELED" | "APPROVED";

type Row = {
  id: string;
  playerName: string;
  playerPosition: string | null;
  amount: number;
  status: string;
  type: string;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  approvedBy: string | null;
  from: string;
  fromLeague: string | null;
  to: string;
};

type Props = {
  rows: Row[];
  currentStatus: string;
};

const FILTERS: TransferStatus[] = [
  "PENDING",
  "COMPLETED",
  "REJECTED",
  "CANCELED",
  "APPROVED",
];

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
}

function getStatusBadge(status: string) {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
  if (status === "COMPLETED") return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";
  if (status === "REJECTED") return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  return "bg-muted text-foreground";
}

export function UserTransfersTable({ rows, currentStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeStatusFilter(status: TransferStatus) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              variant={currentStatus === filter ? "default" : "outline"}
              onClick={() => changeStatusFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            No hay fichajes en este estado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            variant={currentStatus === filter ? "default" : "outline"}
            onClick={() => changeStatusFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{row.playerName}</h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(
                  row.status,
                )}`}
              >
                {row.status}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {row.playerPosition ?? "Sin posición"}
              {row.approvedBy ? ` · procesado por ${row.approvedBy}` : ""}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoBox label="Monto" value={formatCurrency(row.amount)} />
              <InfoBox
                label="Origen"
                value={row.from}
                subvalue={row.fromLeague ?? undefined}
              />
              <InfoBox label="Destino" value={row.to} />
              <InfoBox
                label="Fecha de solicitud"
                value={new Date(row.createdAt).toLocaleDateString("es-AR")}
              />
            </div>

            {row.notes ? (
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Notas
                </p>
                <p className="mt-1 text-sm">{row.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
      {subvalue ? <p className="text-xs text-muted-foreground">{subvalue}</p> : null}
    </div>
  );
}