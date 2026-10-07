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
  /** Mjesto iz ljestvice — NE redni broj u nizu; dijeljeno mjesto ponavlja se. */
  place: number;
  sharedPlace: boolean;
};

export function StandingsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/60">
        Za ovu ljestvicu još nema unesenih rezultata.
      </p>
    );
  }

  // Legenda se ispisuje samo kad u ljestvici stvarno ima dijeljenog mjesta —
  // inače bi objašnjavala znak koji se nigdje ne pojavljuje.
  const imaDijeljenih = rows.some((row) => row.sharedPlace);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-3 py-3 w-14">#</th>
              <th className="px-4 py-3">Igrač</th>
              {/* Na 375 px "Broj turnira" je tjerao tablicu u vodoravno
                  pomicanje. Skraćeno zaglavlje čuva podatak; puni naziv ostaje
                  u title i u aria-label za čitač zaslona. */}
              <th
                className="px-4 py-3 text-right"
                title="Broj turnira"
                aria-label="Broj turnira"
              >
                <span className="sm:hidden">Tur.</span>
                <span className="hidden sm:inline">Broj turnira</span>
              </th>
              <th className="px-4 py-3 text-right font-mono">Bodovi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {rows.map((row) => (
              <tr key={row.player.id}>
                <td className="px-3 py-3">
                  <RankBadge place={row.place} />
                  {row.sharedPlace && (
                    /*
                      title se na dodir ne prikazuje, pa znak sam ne
                      objašnjava ništa — objašnjenje nosi legenda ispod
                      tablice.

                      aria-label ovdje ne radi: ARIA ne dopušta imenovanje
                      generičkog elementa, pa čitači zaslona takvu oznaku na
                      običnom <span> preskoče i pročitaju samo "=". Zato znak
                      ide u aria-hidden, a tekst u sr-only.
                    */
                    <>
                      <span className="ml-1 text-xs text-ink/75" aria-hidden>
                        =
                      </span>
                      <span className="sr-only">dijeljeno mjesto</span>
                    </>
                  )}
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

      {imaDijeljenih && (
        <p className="mt-2 text-xs text-ink/75">
          <span className="font-mono font-semibold">=</span> dijeljeno mjesto —
          svi kriteriji pravilnika daju jednak rezultat.
        </p>
      )}
    </>
  );
}
