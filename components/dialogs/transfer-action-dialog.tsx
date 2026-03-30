"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  playerName: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Row | null;
  action: "APPROVE" | "REJECT" | null;
};

export function TransferActionDialog({
  open,
  onOpenChange,
  row,
  action,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  async function handleSubmit() {
    if (!row || !action) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/transfers/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "No se pudo procesar la solicitud");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("TRANSFER_DIALOG_ACTION_ERROR", error);
      alert("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const title =
    action === "APPROVE"
      ? `Aprobar fichaje de ${row?.playerName ?? ""}`
      : `Rechazar fichaje de ${row?.playerName ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notas</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Aprobado por Discord / No cumple condiciones..."
            rows={5}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant={action === "REJECT" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : action === "APPROVE"
                ? "Confirmar aprobación"
                : "Confirmar rechazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}