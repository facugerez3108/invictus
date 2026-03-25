import { LeagueTable } from "./components/home/league-table";
import { PublicSidebar } from "./components/home/public-sidebar";
import { TopHeader } from "./components/home/top-header";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  const isAuthenticated = !!session;
  const isAdmin = session?.role === "ADMIN";

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <PublicSidebar
          isAuthenticated={isAuthenticated}
          isAdmin={!!isAdmin}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            isAuthenticated={isAuthenticated}
            username={session?.username}
            isAdmin={!!isAdmin}
          />

          <div className="space-y-6 p-4 md:p-6">
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-2xl font-bold">Liga EAFC 26</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Página principal de la liga. Por ahora la tabla es estática
                como prueba visual, pero después la vamos a conectar a la base
                y a los partidos reales.
              </p>
            </section>

            <LeagueTable />
          </div>
        </div>
      </div>
    </main>
  );
}