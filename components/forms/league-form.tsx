"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LeagueFormProps = {
  mode: "create" | "edit";
  league?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
};

export function LeagueForm({ mode, league }: LeagueFormProps) {
  const router = useRouter();

  const [name, setName] = useState(league?.name ?? "");
  const [slug, setSlug] = useState(league?.slug ?? "");
  const [isActive, setIsActive] = useState(league?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name,
        slug: slug.trim() ? slug.trim() : undefined,
        isActive,
      };

      const res = await fetch(
        mode === "create" ? "/api/leagues" : `/api/leagues/${league?.id}`,
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
        setError(data.message || "No se pudo guardar la liga");
        return;
      }

      router.push("/admin/leagues");
      router.refresh();
    } catch {
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
          placeholder="Ej: Premier League"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Ej: premier-league"
        />
        <p className="text-xs text-muted-foreground">
          Si lo dejás vacío, se genera automáticamente desde el nombre.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">Liga activa</Label>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "create"
            ? "Creando..."
            : "Guardando..."
          : mode === "create"
            ? "Crear liga"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
