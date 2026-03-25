import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { premierLeagueTable } from "../../data/premier-league";
import { cn } from "@/lib/utils";

function formBadgeClass(value: "V" | "E" | "D") {
  if (value === "V") return "bg-green-600 text-white";
  if (value === "E") return "bg-yellow-500 text-black";
  return "bg-red-600 text-white";
}

export function LeagueTable() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 md:px-6">
        <h2 className="text-xl font-bold uppercase tracking-wide">
          Premier League
        </h2>
        <p className="text-sm text-muted-foreground">
          Tabla general estática de prueba
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">#</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">PG</TableHead>
              <TableHead className="text-center">PE</TableHead>
              <TableHead className="text-center">PP</TableHead>
              <TableHead className="text-center">GF</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">DG</TableHead>
              <TableHead className="text-center">PTS</TableHead>
              <TableHead className="text-center">Últimos</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {premierLeagueTable.map((team) => (
              <TableRow key={team.position}>
                <TableCell className="font-bold">{team.position}</TableCell>

                <TableCell className="font-medium">{team.team}</TableCell>

                <TableCell className="text-center">{team.played}</TableCell>
                <TableCell className="text-center">{team.won}</TableCell>
                <TableCell className="text-center">{team.drawn}</TableCell>
                <TableCell className="text-center">{team.lost}</TableCell>
                <TableCell className="text-center">{team.goalsFor}</TableCell>
                <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                <TableCell
                  className={cn(
                    "text-center font-medium",
                    team.goalDiff > 0 && "text-green-600",
                    team.goalDiff < 0 && "text-red-600"
                  )}
                >
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </TableCell>
                <TableCell className="text-center font-bold">{team.points}</TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {team.form.map((item, index) => (
                      <span
                        key={`${team.team}-${index}`}
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                          formBadgeClass(item)
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}