type ScorerRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  goals: number;
};

export function TopScorersTable({ rows }: { rows: ScorerRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Jugador</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-center">Goles</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.playerId} className="border-t">
                <td className="px-4 py-3 font-bold">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{row.playerName}</td>
                <td className="px-4 py-3">{row.teamName}</td>
                <td className="px-4 py-3 text-center font-bold">
                  {row.goals}
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No hay goles registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}