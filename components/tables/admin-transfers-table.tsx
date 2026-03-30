"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TransferActionDialog } from "@/components/dialogs/transfer-action-dialog";

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
  requestedBy: string;
  approvedBy: string | null;
  from: string;
  fromLeague: string | null;
  to: string;
  currentBudget: number;
  debtLimit: number;
  projectedBudget: number;
  exceedsDebt: boolean;
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

function getBudgetColor(value: number) {
  if (value < 0) return "text-red-500";
  if (value > 0) return "text-green-600";
  return "text-muted-foreground";
}

function getStatusBadge(status: string) {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
  if (status === "COMPLETED") return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";
  if (status === "REJECTED") return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  return "bg-muted text-foreground";
}

export function AdminTransfersTable({ rows, currentStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [selectedAction, setSelectedAction] = useState<"APPROVE" | "REJECT" | null>(null);

  const isPendingView = currentStatus === "PENDING";

  const activeRows = useMemo(() => rows, [rows]);

  function changeStatusFilter(status: TransferStatus) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  function openActionDialog(row: Row, action: "APPROVE" | "REJECT") {
    setSelectedRow(row);
    setSelectedAction(action);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
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

      {!activeRows.length ? (
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            No hay registros para el estado seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRows.map((row) => (
            <div key={row.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
                    {row.playerPosition ?? "Sin posición"} · solicitado por{" "}
                    {row.requestedBy}
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
                      label="Fecha"
                      value={new Date(row.createdAt).toLocaleDateString("es-AR")}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricBox
                      label="Presupuesto actual"
                      value={formatCurrency(row.currentBudget)}
                      valueClassName={getBudgetColor(row.currentBudget)}
                    />
                    <MetricBox
                      label="Presupuesto proyectado"
                      value={formatCurrency(row.projectedBudget)}
                      valueClassName={getBudgetColor(row.projectedBudget)}
                    />
                    <MetricBox
                      label="Límite de deuda"
                      value={formatCurrency(row.debtLimit)}
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

                  {row.exceedsDebt && isPendingView ? (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                      Esta solicitud excede el límite de deuda permitido.
                    </div>
                  ) : null}
                </div>

                {isPendingView ? (
                  <div className="flex flex-row gap-2 xl:flex-col">
                    <Button
                      onClick={() => openActionDialog(row, "APPROVE")}
                      disabled={row.exceedsDebt}
                    >
                      Aprobar
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => openActionDialog(row, "REJECT")}
                    >
                      Rechazar
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransferActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={selectedRow}
        action={selectedAction}
      />
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

function MetricBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-semibold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}