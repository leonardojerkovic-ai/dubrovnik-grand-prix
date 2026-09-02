import { RankBadge } from "@/components/rank-badge";
import { PlayerName } from "@/components/player-name";

type Row = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    isClubMember: boolean;
  };
  total: number;
  countedResults: { gpPoints: number }[];
  allResults: { gpPoints: number }[];
};

export function StandingsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
        Za ovu ljestvicu još nema unesenih rezultata.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
          <tr>
            <th className="px-3 py-3 w-14">#</th>
            <th className="px-4 py-3">Igrač</th>
            <th className="px-4 py-3 text-right">Broj turnira</th>
            <th className="px-4 py-3 text-right font-mono">Bodovi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/10">
          {rows.map((row, i) => (
            <tr key={row.player.id}>
              <td className="px-3 py-3">
                <RankBadge place={i + 1} />
              </td>
              <td className="px-4 py-3 font-medium text-navy">
                <PlayerName {...row.player} />
              </td>
              <td className="px-4 py-3 text-right text-ink/60 font-mono tabular-nums">
                {row.allResults.length}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-navy">
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
