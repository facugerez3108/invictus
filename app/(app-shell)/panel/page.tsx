import { requireAuth } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PanelPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Panel del usuario</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bienvenido, {session.username}. Acá después podés mostrar el equipo
            asignado, historial y estadísticas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}