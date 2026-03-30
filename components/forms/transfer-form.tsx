"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type PlayerOption = {
  id: string;
  name: string;
  position?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  currentClubName?: string | null;
  currentLeagueName?: string | null;
};

type TeamOption = {
  id: string;
  name: string;
  budget: number;
  debtLimit: number;
};

type Props = {
  players: PlayerOption[];
  teams: TeamOption[];
  destinationTeam: TeamOption;
};

type OriginType = "INTERNAL" | "EXTERNAL";

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
}

export function TransferForm({ players, teams, destinationTeam }: Props) {
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [originType, setOriginType] = useState<OriginType>("INTERNAL");
  const [fromTeamId, setFromTeamId] = useState("");
  const [fromExternalName, setFromExternalName] = useState("");
  const [fromExternalLeague, setFromExternalLeague] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPlayer = players.find((player) => player.id === playerId);
  const selectedFromTeam = teams.find((team) => team.id === fromTeamId);

  const numericAmount = Number(amount || 0);
  const currentBudget = Number(destinationTeam.budget);
  const debtLimit = Number(destinationTeam.debtLimit);
  const projectedBudget = currentBudget - numericAmount;
  const exceedsDebt = projectedBudget < -debtLimit;

  const availableInternalTeams = useMemo(() => {
    return teams.filter((team) => team.id !== destinationTeam.id);
  }, [teams, destinationTeam.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        originType === "INTERNAL"
          ? {
              originType: "INTERNAL",
              playerId,
              toTeamId: destinationTeam.id,
              fromTeamId,
              amount: numericAmount,
            }
          : {
              originType: "EXTERNAL",
              playerId,
              toTeamId: destinationTeam.id,
              fromExternalName: fromExternalName.trim(),
              fromExternalLeague: fromExternalLeague.trim(),
              amount: numericAmount,
            };

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo crear la solicitud de fichaje");
        return;
      }

      router.push("/fichajes");
      router.refresh();
    } catch (err) {
      console.error("TRANSFER_FORM_ERROR", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const isInternalInvalid =
    originType === "INTERNAL" &&
    (!playerId || !fromTeamId || numericAmount <= 0);

  const isExternalInvalid =
    originType === "EXTERNAL" &&
    (!playerId || !fromExternalName.trim() || numericAmount <= 0);

  const isSubmitDisabled =
    loading ||
    exceedsDebt ||
    (originType === "INTERNAL" ? isInternalInvalid : isExternalInvalid);
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-2xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Jugador</h2>
          <p className="text-sm text-muted-foreground">
            Seleccioná el jugador que querés incorporar.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Jugador</Label>
          <Select
            value={playerId || null}
            onValueChange={(value) => setPlayerId(value ?? "")}
          >
            <SelectTrigger>
              {selectedPlayer
                ? `${selectedPlayer.name}${selectedPlayer.position ? ` - ${selectedPlayer.position}` : ""}`
                : "Seleccionar jugador"}
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                  {player.position ? ` - ${player.position}` : ""}
                  {player.teamName
                    ? ` (${player.teamName})`
                    : player.currentClubName
                      ? ` (${player.currentClubName})`
                      : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Equipo destino</h2>
          <p className="text-sm text-muted-foreground">
            El fichaje será solicitado para tu equipo.
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 p-4">
          <p className="text-sm font-medium">{destinationTeam.name}</p>
          <p className="text-xs text-muted-foreground">
            Presupuesto actual: {formatCurrency(currentBudget)}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Origen del fichaje</h2>
          <p className="text-sm text-muted-foreground">
            Indicá si el jugador viene de un equipo registrado o de un club
            externo.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant={originType === "INTERNAL" ? "default" : "outline"}
            onClick={() => setOriginType("INTERNAL")}
          >
            Equipo registrado
          </Button>

          <Button
            type="button"
            variant={originType === "EXTERNAL" ? "default" : "outline"}
            onClick={() => setOriginType("EXTERNAL")}
          >
            Club externo
          </Button>
        </div>

        {originType === "INTERNAL" ? (
          <div className="space-y-2">
            <Label>Equipo origen</Label>
            <Select
              value={fromTeamId || null}
              onValueChange={(value) => setFromTeamId(value ?? "")}
            >
              <SelectTrigger>
                {selectedFromTeam
                  ? selectedFromTeam.name
                  : "Seleccionar equipo origen"}
              </SelectTrigger>
              <SelectContent>
                {availableInternalTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromExternalName">Club de origen</Label>
              <Input
                id="fromExternalName"
                value={fromExternalName}
                onChange={(e) => setFromExternalName(e.target.value)}
                placeholder="Ej: Al-Nassr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromExternalLeague">Liga de origen</Label>
              <Input
                id="fromExternalLeague"
                value={fromExternalLeague}
                onChange={(e) => setFromExternalLeague(e.target.value)}
                placeholder="Ej: Saudi Pro League"
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Monto</h2>
          <p className="text-sm text-muted-foreground">
            Indicá el costo del fichaje.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej: 7000000"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Resumen de impacto</h2>
          <p className="text-sm text-muted-foreground">
            Vista previa del efecto financiero sobre tu equipo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Presupuesto actual</p>
            <p className="text-lg font-semibold">
              {formatCurrency(currentBudget)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Monto del fichaje</p>
            <p className="text-lg font-semibold">
              {formatCurrency(numericAmount || 0)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              Presupuesto proyectado
            </p>
            <p
              className={`text-lg font-semibold ${
                projectedBudget < 0
                  ? "text-red-500"
                  : projectedBudget > 0
                    ? "text-green-600"
                    : "text-muted-foreground"
              }`}
            >
              {formatCurrency(projectedBudget)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">
            Límite de deuda permitido
          </p>
          <p className="text-lg font-semibold">{formatCurrency(debtLimit)}</p>
        </div>

        {exceedsDebt ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            Este fichaje excede el límite de deuda permitido para tu equipo.
          </div>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={isSubmitDisabled}>
        {loading ? "Enviando solicitud..." : "Solicitar fichaje"}
      </Button>
    </form>
  );
}
