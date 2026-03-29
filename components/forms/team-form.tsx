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
  SelectValue,
} from "@/components/ui/select";

type LeagueOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
};

type Props = {
  mode: "create" | "edit";
  leagues: LeagueOption[];
  users: UserOption[];
  team?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    slug: string;
    budget: number;
    isAvailable: boolean;
    leagueId: string;
    ownerId: string | null;
  };
};

export function TeamForm({ mode, leagues, users, team }: Props) {
  const router = useRouter();

  const [name, setName] = useState(team?.name ?? "");
  const [slug, setSlug] = useState(team?.slug ?? "");
  const [avatarUrl, setAvatarUrl] = useState(team?.avatarUrl ?? "");
  const [budget, setBudget] = useState(team?.budget?.toString() ?? "0");
  const [isAvailable, setIsAvailable] = useState(team?.isAvailable ?? true);
  const [leagueId, setLeagueId] = useState(team?.leagueId ?? "");
  const [ownerId, setOwnerId] = useState<string>(team?.ownerId ?? "none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLeague = leagues.find((league) => league.id === leagueId);
  const selectedOwner =
    ownerId === "none" ? null : users.find((user) => user.id === ownerId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() ? slug.trim() : undefined,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
        budget: Number(budget),
        isAvailable,
        leagueId,
        ownerId: ownerId === "none" ? null : ownerId,
      };

      const res = await fetch(
        mode === "create" ? "/api/teams" : `/api/teams/${team?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo guardar el equipo");
        return;
      }

      router.push("/admin/teams");
      router.refresh();
    } catch (err) {
      console.error("TEAM_FORM_ERROR", err);
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
          placeholder="Ej: Arsenal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Ej: arsenal"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Escudo (URL)</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Presupuesto</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Ej: 1000000"
        />
      </div>

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
        <Label>Owner</Label>
        <Select
          value={ownerId || null}
          onValueChange={(value) => setOwnerId(value ?? "")}
        >
          <SelectTrigger>
            {selectedOwner
              ? `${selectedOwner.username} (${selectedOwner.role})`
              : "Sin owner"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin owner</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.username} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isAvailable"
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="isAvailable">Equipo disponible</Label>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "create"
            ? "Creando..."
            : "Guardando..."
          : mode === "create"
            ? "Crear equipo"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
