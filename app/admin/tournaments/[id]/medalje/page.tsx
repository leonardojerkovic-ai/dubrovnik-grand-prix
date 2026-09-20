import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MedalDisc } from "@/components/medal-disc";
import {
  MEDAL_PRIORITY,
  medalEventForTournament,
  type AkademijaMedalCategory,
} from "@/lib/scoring/akademija/medals";
import type { MedalCategory } from "@prisma/client";
import { clearManualMedal, recomputeMedals, setMedalManually } from "./actions";

/**
 * Ručni ispravak medalja jednog turnira Akademije.
 *
 * Popis mjesta nije proizvoljan nego proizlazi iz čl. 19: kvalifikacijski
 * turnir ima tri mjesta ukupnog poretka i po jednu kategorijsku medalju,
 * Prvenstvo Akademije samo tri ukupna. Zato se ovdje ne dodaju nova mjesta,
 * nego se postojećima po potrebi mijenja dobitnik.
 */

const SLOTS: Record<string, { category: AkademijaMedalCategory; count: number }[]> =
  {
    KVALIFIKACIJSKI: [
      { category: "UKUPNO", count: 3 },
      { category: "U12", count: 1 },
      { category: "U10", count: 1 },
      { category: "U08", count: 1 },
      { category: "ZENE", count: 1 },
    ],
    PRVENSTVO: [{ category: "UKUPNO", count: 3 }],
    KONACNI_POREDAK: [],
  };

function slotLabel(category: AkademijaMedalCategory, place: number): string {
  if (category === "UKUPNO") return `${place}. mjesto`;
  if (category === "ZENE") return "Najbolja igračica";
  return `Najbolji u kategoriji ${category}`;
}

export default async function AdminMedalsPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: { season: true },
  });
  if (!tournament) notFound();

  if (tournament.season.system !== "AKADEMIJA") {
    return (
      <div>
        <h2 className="font-display text-lg font-bold text-navy mb-2">
          Medalje
        </h2>
        <p className="max-w-prose text-sm text-ink/70">
          Medalje propisuje pravilnik Akademije (čl. 19) i postoje samo na
          njezinim turnirima. Turniri glavnog GP-a imaju{" "}
          <Link
            href={`/admin/tournaments/${tournament.id}/nagrade`}
            className="font-medium text-navy hover:underline"
          >
            nagrade
          </Link>
          , koje se definiraju po turniru.
        </p>
      </div>
    );
  }

  const [medals, results] = await Promise.all([
    prisma.medal.findMany({
      where: { tournamentId: tournament.id },
      include: { player: { select: { firstName: true, lastName: true } } },
    }),
    prisma.tournamentResult.findMany({
      where: { tournamentId: tournament.id, gamesPlayed: true },
      orderBy: { rank: "asc" },
      include: { player: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ]);

  const bySlot = new Map(medals.map((m) => [`${m.category}/${m.place}`, m]));
  const event = medalEventForTournament(tournament.isFinal);
  const slots = SLOTS[event] ?? [];

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
          Medalje — {tournament.name}
        </h2>
        <p className="text-xs text-ink/55">
          {tournament.isFinal ? "Prvenstvo Akademije" : "Kvalifikacijski turnir"}{" "}
          · {results.length} igrača
        </p>
      </div>

      <div className="mb-6 rounded-md border border-navy/10 bg-sky-light/30 px-4 py-3 text-sm text-ink/75">
        Dodjela se računa sama iz poretka. Ručni odabir ovdje označava se kao
        iznimka i preživljava sve kasnije izmjene rezultata — dok ga sam ne
        poništiš. Obrazloženje se prikazuje uz medalju na javnoj stranici.
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Medalja</th>
              <th className="px-4 py-3">Dobitnik</th>
              <th className="px-4 py-3">Izmjena</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {slots.flatMap((slot) =>
              Array.from({ length: slot.count }, (_, i) => i + 1).map((place) => {
                const key = `${slot.category}/${place}`;
                const medal = bySlot.get(key);
                return (
                  <tr key={key}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <MedalDisc
                          category={slot.category as MedalCategory}
                          place={place}
                        />
                        <span className="text-navy">
                          {slotLabel(slot.category, place)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {medal ? (
                        <>
                          <span className="font-medium text-navy">
                            {medal.player.lastName} {medal.player.firstName}
                          </span>
                          {medal.manual && (
                            <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-navy">
                              ručno
                            </span>
                          )}
                          {medal.note && (
                            <span className="mt-0.5 block text-xs text-ink/55">
                              {medal.note}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-ink/40">
                          nije dodijeljena
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const playerId = String(formData.get("playerId") ?? "");
                          if (!playerId) return;
                          await setMedalManually(
                            tournament.id,
                            slot.category as MedalCategory,
                            place,
                            playerId,
                            String(formData.get("note") ?? "")
                          );
                        }}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <select
                          name="playerId"
                          defaultValue=""
                          className="input max-w-[220px] text-xs"
                        >
                          <option value="">— odaberi igrača —</option>
                          {results.map((r) => (
                            <option key={r.player.id} value={r.player.id}>
                              {r.rank}. {r.player.lastName} {r.player.firstName}
                            </option>
                          ))}
                        </select>
                        <input
                          name="note"
                          placeholder="obrazloženje"
                          className="input max-w-[180px] text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5"
                        >
                          Postavi
                        </button>
                      </form>

                      {medal?.manual && (
                        <form
                          action={async () => {
                            "use server";
                            await clearManualMedal(
                              tournament.id,
                              slot.category as MedalCategory,
                              place
                            );
                          }}
                          className="mt-1"
                        >
                          <button
                            type="submit"
                            className="text-xs text-crimson hover:underline"
                          >
                            Vrati na automatski izračun
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <form
        action={async () => {
          "use server";
          await recomputeMedals(tournament.id);
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
    </div>
  );
}
