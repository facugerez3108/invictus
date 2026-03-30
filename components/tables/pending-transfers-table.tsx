"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  playerName: string;
  playerPosition: string | null;
  amount: number;
  createdAt: string;
  requestedBy: string;
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
};

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
}

function BudgetText({ value }: { value: number }) {
  return (
    <span
      className={
        value < 0
          ? "font-semibold text-red-500"
          : value > 0
            ? "font-semibold text-green-600"
            : "font-semibold text-muted-foreground"
      }
    >
      {formatCurrency(value)}
    </span>
  );
}

export function PendingTransfersTable({ rows }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, action: "APPROVE" | "REJECT") {
    try {
      setLoadingId(id);

      const res = await fetch(`/api/admin/transfers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo procesar la solicitud");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("TRANSFER_ACTION_ERROR", error);
      alert("Ocurrió un error inesperado");
    } finally {
      setLoadingId(null);
    }
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay fichajes pendientes para revisar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const isLoading = loadingId === row.id;

        return (
          <div
            key={row.id}
            className="rounded-2xl border p-4 transition-colors"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{row.playerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {row.playerPosition ?? "Sin posición"} · solicitado por{" "}
                    {row.requestedBy}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Monto
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(row.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Origen
                    </p>
                    <p className="mt-1 font-semibold">{row.from}</p>
                    {row.fromLeague ? (
                      <p className="text-xs text-muted-foreground">
                        {row.fromLeague}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Destino
                    </p>
                    <p className="mt-1 font-semibold">{row.to}</p>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Fecha
                    </p>
                    <p className="mt-1 font-semibold">
                      {new Date(row.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Presupuesto actual
                    </p>
                    <div className="mt-1">
                      <BudgetText value={row.currentBudget} />
                    </div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Presupuesto proyectado
                    </p>
                    <div className="mt-1">
                      <BudgetText value={row.projectedBudget} />
                    </div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Límite de deuda
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(row.debtLimit)}
                    </p>
                  </div>
                </div>

                {row.exceedsDebt ? (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                    Esta solicitud excede el límite de deuda permitido.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-row gap-2 xl:flex-col">
                <Button
                  onClick={() => handleAction(row.id, "APPROVE")}
                  disabled={isLoading || row.exceedsDebt}
                >
                  {isLoading ? "Procesando..." : "Aprobar"}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleAction(row.id, "REJECT")}
                  disabled={isLoading}
                >
                  {isLoading ? "Procesando..." : "Rechazar"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}