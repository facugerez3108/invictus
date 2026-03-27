"use client";

import { useState } from "react";
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

type TeamOption = {
  id: string;
  name: string;
  leagueName: string;
};

type Props = {
  mode: "create" | "edit";
  teams: TeamOption[];
  player?: {
    id: string;
    name: string;
    number: number | null;
    position: string | null;
    isActive: boolean;
    teamId: string;
  };
};

export function PlayerForm({ mode, teams, player }: Props) {
  const router = useRouter();

  const [name, setName] = useState(player?.name ?? "");
  const [number, setNumber] = useState(
    player?.number != null ? String(player.number) : ""
  );
  const [position, setPosition] = useState(player?.position ?? "");
  const [isActive, setIsActive] = useState(player?.isActive ?? true);
  const [teamId, setTeamId] = useState(player?.teamId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTeam = teams.find((team) => team.id === teamId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        number: number.trim() ? Number(number) : null,
        position: position.trim() ? position.trim() : null,
        isActive,
        teamId,
      };

      const res = await fetch(
        mode === "create" ? "/api/players" : `/api/players/${player?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const contentType = res.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await res.json()
          : null;

      if (!res.ok) {
        setError(data?.message || "No se pudo guardar el jugador");
        return;
      }

      router.push("/admin/players");
      router.refresh();
    } catch (err) {
      console.error("PLAYER_FORM_ERROR", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Salah"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">Número</Label>
        <Input
          id="number"
          type="number"
          min="1"
          max="99"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Ej: 11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Posición</Label>
        <Input
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Ej: ST, LW, CM"
        />
      </div>

      <div className="space-y-2">
        <Label>Equipo</Label>
        <Select
          value={teamId || null}
          onValueChange={(value) => setTeamId(value ?? "")}
        >
          <SelectTrigger>
            {selectedTeam
              ? `${selectedTeam.name} - ${selectedTeam.leagueName}`
              : "Seleccionar equipo"}
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name} - {team.leagueName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">Jugador activo</Label>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "create"
            ? "Creando..."
            : "Guardando..."
          : mode === "create"
            ? "Crear jugador"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}