import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { getTournamentPrizes } from "@/lib/tournament-prizes";
import { PrizeForm } from "./prize-form";
import {
  createPrize,
  deletePrize,
  movePrize,
  recomputePrizes,
} from "./actions";

/**
 * Nagrade jednog turnira.
 *
 * Redoslijed na popisu JEST redoslijed priznanja: nagrade se obilaze odozgo
 * prema dolje i svaka pada na prvog igrača koji zadovoljava njezine uvjete,
 * a još nema nagradu. Zato je premještanje gore-dolje vidljivo i važno, a ne
 * kozmetika.
 */

function criteriaSummary(prize: {
  gender: string | null;
  birthYearMin: number | null;
  birthYearMax: number | null;
  ratingMin: number | null;
  ratingMax: number | null;
  clubMembersOnly: boolean;
}): string {
  const parts: string[] = [];
  if (prize.gender === "F") parts.push("žene");
  if (prize.gender === "M") parts.push("muškarci");
  if (prize.birthYearMin) parts.push(`godište ${prize.birthYearMin}. i mlađi`);
  if (prize.birthYearMax) parts.push(`godište ${prize.birthYearMax}. i stariji`);
  if (prize.ratingMin) parts.push(`rejting od ${prize.ratingMin}`);
  if (prize.ratingMax) parts.push(`rejting ispod ${prize.ratingMax}`);
  if (prize.clubMembersOnly) parts.push("članovi kluba");
  return parts.length > 0 ? parts.join(" · ") : "svi igrači";
}

export default async function AdminPrizesPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: { season: true, _count: { select: { results: true } } },
  });
  if (!tournament) notFound();

  const [prizes, awards] = await Promise.all([
    prisma.tournamentPrize.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { priority: "asc" },
    }),
    getTournamentPrizes(tournament.id),
  ]);

  const winnersByPrize = new Map<string, typeof awards>();
  for (const award of awards) {
    const list = winnersByPrize.get(award.prizeId) ?? [];
    list.push(award);
    winnersByPrize.set(award.prizeId, list);
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/admin/tournaments/${tournament.id}/results`}
          className="text-xs font-semibold text-navy hover:underline"
        >
          ← Rezultati turnira
        </Link>
        <h2 className="font-display text-lg font-bold text-navy">
          Nagrade — {tournament.name}
        </h2>
        <p className="text-xs text-ink/55">
          Sezona {tournament.season.yearLabel} · {tournament._count.results}{" "}
          unesenih rezultata
        </p>
      </div>

      <div className="mb-6 rounded-md border border-navy/10 bg-sky-light/30 px-4 py-3 text-sm text-ink/75">
        Nagrade se ne kumuliraju. Igrač prima samo najvišu nagradu koju je
        ostvario, a nagrada koja time ostane slobodna pripada sljedećem igraču
        koji zadovoljava njezine uvjete. Redoslijed na popisu odlučuje što je
        „više" — zato su strelice bitne.
      </div>

      <div className="mb-8 rounded-lg border border-navy/10 bg-white p-4">
        <PrizeForm
          action={createPrize}
          tournamentId={tournament.id}
          seasonStartYear={tournament.season.startDate.getFullYear()}
        />
      </div>

      {prizes.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Za ovaj turnir još nije unesena nijedna nagrada.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-3 py-3 w-16">Red</th>
                  <th className="px-4 py-3">Nagrada</th>
                  <th className="px-4 py-3">Uvjeti</th>
                  <th className="px-4 py-3">Dobitnici</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {prizes.map((prize, index) => (
                  <tr key={prize.id}>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {index > 0 && (
                          <form
                            action={async () => {
                              "use server";
                              await movePrize(prize.id, "up");
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded border border-navy/20 px-1.5 text-navy hover:bg-navy/5"
                              aria-label="Pomakni gore"
                            >
                              ↑
                            </button>
                          </form>
                        )}
                        {index < prizes.length - 1 && (
                          <form
                            action={async () => {
                              "use server";
                              await movePrize(prize.id, "down");
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded border border-navy/20 px-1.5 text-navy hover:bg-navy/5"
                              aria-label="Pomakni dolje"
                            >
                              ↓
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-navy">
                        {prize.label}
                      </span>
                      {prize.count > 1 && (
                        <span className="ml-2 text-xs text-ink/55">
                          ×{prize.count}
                        </span>
                      )}
                      {prize.shortLabel && (
                        <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-navy">
                          {prize.shortLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/60">
                      {criteriaSummary(prize)}
                    </td>
                    <td className="px-4 py-3">
                      {(winnersByPrize.get(prize.id) ?? []).length === 0 ? (
                        <span className="text-xs text-ink/40">—</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {(winnersByPrize.get(prize.id) ?? []).map((a) => (
                            <li key={a.place} className="text-navy">
                              {prize.count > 1 && (
                                <span className="mr-1 text-ink/50">
                                  {a.place}.
                                </span>
                              )}
                              {a.playerName}
                              {a.transferred && (
                                <span
                                  className="ml-1 text-xs text-ink/50"
                                  title="Igrači ispred u ovoj skupini već su primili višu nagradu"
                                >
                                  (prenesena)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deletePrize(prize.id);
                        }}
                      >
                        <ConfirmDeleteButton confirmText={`Obrisati nagradu "${prize.label}"?`} />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            action={async () => {
              "use server";
              await recomputePrizes(tournament.id);
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Preračunaj dodjelu
            </button>
          </form>
          <p className="mt-2 text-xs text-ink/55">
            Dodjela se preračunava sama pri svakom spremanju rezultata i pri
            izmjeni nagrada. Ovaj gumb treba samo ako želiš provjeriti stanje.
          </p>
        </>
      )}
    </div>
  );
}
