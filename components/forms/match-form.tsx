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
  SelectValue,
} from "@/components/ui/select";

type LeagueOption = {
  id: string;
  name: string;
};

type TeamOption = {
  id: string;
  name: string;
  leagueId: string;
};

type MatchStatus = "SCHEDULED" | "PLAYED" | "CANCELED";

type Props = {
  mode: "create" | "edit";
  leagues: LeagueOption[];
  teams: TeamOption[];
  match?: {
    id: string;
    leagueId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number | null;
    awayGoals: number | null;
    playedAt: string | null;
    status: MatchStatus;
  };
};

export function MatchForm({ mode, leagues, teams, match }: Props) {
  const router = useRouter();

  const [leagueId, setLeagueId] = useState(match?.leagueId ?? "");
  const [homeTeamId, setHomeTeamId] = useState(match?.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match?.awayTeamId ?? "");
  const [homeGoals, setHomeGoals] = useState(
    match?.homeGoals != null ? String(match.homeGoals) : "",
  );
  const [awayGoals, setAwayGoals] = useState(
    match?.awayGoals != null ? String(match.awayGoals) : "",
  );
  const [playedAt, setPlayedAt] = useState(
    match?.playedAt ? match.playedAt.slice(0, 16) : "",
  );
  const [status, setStatus] = useState<MatchStatus>(
    match?.status ?? "SCHEDULED",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredTeams = useMemo(
    () => teams.filter((team) => team.leagueId === leagueId),
    [teams, leagueId],
  );

  const selectedLeague = leagues.find((league) => league.id === leagueId);
  const selectedHomeTeam = filteredTeams.find((team) => team.id === homeTeamId);
  const selectedAwayTeam = filteredTeams.find((team) => team.id === awayTeamId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        leagueId,
        homeTeamId,
        awayTeamId,
        homeGoals: homeGoals === "" ? null : Number(homeGoals),
        awayGoals: awayGoals === "" ? null : Number(awayGoals),
        playedAt: playedAt ? new Date(playedAt).toISOString() : null,
        status,
      };

      const res = await fetch(
        mode === "create" ? "/api/matches" : `/api/matches/${match?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const contentType = res.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await res.json()
          : null;

      if (!res.ok) {
        setError(data?.message || "No se pudo guardar el partido");
        return;
      }

      router.push("/admin/matches");
      router.refresh();
    } catch (err) {
      console.error("MATCH_FORM_ERROR", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label>Liga</Label>
        <Select
          value={leagueId || null}
          onValueChange={(value) => setLeagueId(value ?? "")}
        >
          <SelectTrigger>
            {selectedLeague ? selectedLeague.name : "Seleccionar liga"}
          </SelectTrigger>
          <SelectContent>
            {leagues.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Equipo local</Label>
        <Select
          value={homeTeamId || null}
          onValueChange={(value) => setHomeTeamId(value ?? "")}
        >
          <SelectTrigger>
            {selectedHomeTeam ? selectedHomeTeam.name : "Seleccionar local"}
          </SelectTrigger>
          <SelectContent>
            {filteredTeams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Equipo visitante</Label>
        <Select
          value={awayTeamId || null}
          onValueChange={(value) => setAwayTeamId(value ?? "")}
        >
          <SelectTrigger>
            {selectedAwayTeam ? selectedAwayTeam.name : "Seleccionar visitante"}
          </SelectTrigger>
          <SelectContent>
            {filteredTeams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus((value ?? "SCHEDULED") as MatchStatus)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
            <SelectItem value="PLAYED">PLAYED</SelectItem>
            <SelectItem value="CANCELED">CANCELED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="homeGoals">Goles local</Label>
          <Input
            id="homeGoals"
            type="number"
            min="0"
            value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="awayGoals">Goles visitante</Label>
          <Input
            id="awayGoals"
            type="number"
            min="0"
            value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="playedAt">Fecha</Label>
        <Input
          id="playedAt"
          type="datetime-local"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "create"
            ? "Creando..."
            : "Guardando..."
          : mode === "create"
            ? "Crear partido"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
