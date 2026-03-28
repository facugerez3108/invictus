import Image from "next/image";

type StandingRow = {
  teamId: string;
  teamName: string;
  avatarUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("V" | "E" | "D")[];
};

function badgeClass(value: "V" | "E" | "D") {
  if (value === "V") return "bg-green-600 text-white";
  if (value === "E") return "bg-yellow-500 text-black";
  return "bg-red-600 text-white";
}

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-center">PJ</th>
              <th className="px-4 py-3 text-center">PG</th>
              <th className="px-4 py-3 text-center">PE</th>
              <th className="px-4 py-3 text-center">PP</th>
              <th className="px-4 py-3 text-center">GF</th>
              <th className="px-4 py-3 text-center">GC</th>
              <th className="px-4 py-3 text-center">DG</th>
              <th className="px-4 py-3 text-center">PTS</th>
              <th className="px-4 py-3 text-center">Últimos</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.teamId} className="border-t">
                <td className="px-4 py-3 font-bold">{index + 1}</td>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    {row.avatarUrl ? (
                      <img
                        src={row.avatarUrl}
                        alt={row.teamName}
                        className="h-4 w-4 shrink-0 object-contain"
                      />
                    ) : (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[8px] font-bold">
                        {row.teamName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span>{row.teamName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">{row.played}</td>
                <td className="px-4 py-3 text-center">{row.won}</td>
                <td className="px-4 py-3 text-center">{row.drawn}</td>
                <td className="px-4 py-3 text-center">{row.lost}</td>
                <td className="px-4 py-3 text-center">{row.goalsFor}</td>
                <td className="px-4 py-3 text-center">{row.goalsAgainst}</td>
                <td className="px-4 py-3 text-center">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="px-4 py-3 text-center font-bold">
                  {row.points}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {row.form.map((item, i) => (
                      <span
                        key={`${row.teamId}-${i}`}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${badgeClass(item)}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No hay datos en la tabla.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
