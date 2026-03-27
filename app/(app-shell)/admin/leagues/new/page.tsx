import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeagueForm } from "@/components/forms/league-form";

export default async function NewLeaguePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Nueva liga</CardTitle>
          <p className="text-sm text-muted-foreground">
            Creá una nueva liga para el sistema
          </p>
        </CardHeader>

        <CardContent>
          <LeagueForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}