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

type TeamOption = {
  id: string;
  name: string;
};

type PlayerOption = {
  id: string;
  name: string;
  teamId: string;
};

type MatchEventType = "GOAL" | "YELLOW_CARD" | "RED_CARD";

type Props = {
  matchId: string;
  teams: TeamOption[];
  players: PlayerOption[];
};

export function MatchEventForm({ matchId, teams, players }: Props) {
  const router = useRouter();

  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState<MatchEventType>("GOAL");
  const [minute, setMinute] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredPlayers = useMemo(
    () => players.filter((player) => player.teamId === teamId),
    [players, teamId]
  );

  const selectedTeam = teams.find((team) => team.id === teamId);
  const selectedPlayer = filteredPlayers.find((player) => player.id === playerId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        matchId,
        teamId,
        playerId,
        type,
        minute: Number(minute),
      };

      const res = await fetch("/api/match-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await res.json()
          : null;

      if (!res.ok) {
        setError(data?.message || "No se pudo guardar el evento");
        return;
      }

      setPlayerId("");
      setType("GOAL");
      setMinute("1");

      router.refresh();
    } catch (err) {
      console.error("MATCH_EVENT_FORM_ERROR", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label>Equipo</Label>
        <Select
          value={teamId || null}
          onValueChange={(value) => {
            setTeamId(value ?? "");
            setPlayerId("");
          }}
        >
          <SelectTrigger>
            {selectedTeam ? selectedTeam.name : "Seleccionar equipo"}
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Jugador</Label>
        <Select
          value={playerId || null}
          onValueChange={(value) => setPlayerId(value ?? "")}
        >
          <SelectTrigger>
            {selectedPlayer ? selectedPlayer.name : "Seleccionar jugador"}
          </SelectTrigger>
          <SelectContent>
            {filteredPlayers.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de evento</Label>
        <Select
          value={type}
          onValueChange={(value) => setType((value ?? "GOAL") as MatchEventType)}
        >
          <SelectTrigger>{type}</SelectTrigger>
          <SelectContent>
            <SelectItem value="GOAL">GOAL</SelectItem>
            <SelectItem value="YELLOW_CARD">YELLOW_CARD</SelectItem>
            <SelectItem value="RED_CARD">RED_CARD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minute">Minuto</Label>
        <Input
          id="minute"
          type="number"
          min="1"
          max="130"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Agregar evento"}
      </Button>
    </form>
  );
}