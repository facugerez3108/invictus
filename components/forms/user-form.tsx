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
import { EyeOff, Eye } from "lucide-react";

type Props = {
  mode: "create" | "edit";
  user?: {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
  };
};

export function UserForm({ mode, user }: Props) {
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">(user?.role ?? "USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        mode === "create"
          ? {
              username: username.trim(),
              password: password.trim(),
              role,
            }
          : {
              ...(username.trim() ? { username: username.trim() } : {}),
              ...(password.trim() ? { password: password.trim() } : {}),
              role,
            };

      const res = await fetch(
        mode === "create" ? "/api/users" : `/api/users/${user?.id}`,
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
        setError(data.message || "Ocurrió un error");
        return;
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      console.error("USER_FORM_ERROR", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresá un username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {mode === "create" ? "Contraseña" : "Nueva contraseña"}
        </Label>
        <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            mode === "create"
              ? "Ingresá una contraseña"
              : "Dejá vacío para no cambiarla"
          }
        />
        <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
        >
            {
                showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
            }
        </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>

        <Select
          value={role}
          onValueChange={(value) => setRole(value as "ADMIN" | "USER")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading
          ? mode === "create"
            ? "Creando..."
            : "Guardando..."
          : mode === "create"
            ? "Crear usuario"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
