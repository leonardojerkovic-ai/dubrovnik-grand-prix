import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlayerName } from "@/components/player-name";
import { MedalDisc } from "@/components/medal-disc";
import { MEDAL_PRIORITY } from "@/lib/scoring/akademija/medals";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "Pobjednici i najbolji plasmani kroz povijest Dubrovnik Grand Prixa.",
};

export default async function HallOfFamePage() {
  const entries = await prisma.hallOfFame.findMany({
    orderBy: [{ seasonId: "desc" }, { categoryCode: "asc" }, { place: "asc" }],
    include: { season: true, player: true },
  });

  /**
   * Medalje konačnog poretka (čl. 19 st. 3) stoje uz Hall of Fame jer
   * opisuju isto: tko je sezonu završio na vrhu. Hall of Fame bilježi
   * pobjednike ljestvica, medalje i kategorijska odličja koja iz tog istog
   * poretka slijede.
   */
  const seasonMedals = await prisma.medal.findMany({
    where: { tournamentId: null },
    orderBy: [{ seasonId: "desc" }, { place: "asc" }],
    include: {
      season: { select: { id: true, yearLabel: true, system: true } },
      player: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const medalsBySeason = seasonMedals.reduce<
    Record<string, typeof seasonMedals>
  >((acc, m) => {
    (acc[m.seasonId] ??= []).push(m);
    return acc;
  }, {});

  const grouped = entries.reduce<
    Record<string, { season: (typeof entries)[number]["season"]; items: typeof entries }>
  >((acc, e) => {
    const key = `${e.seasonId}-${e.categoryCode}`;
    (acc[key] ??= { season: e.season, items: [] }).items.push(e);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">
        Hall of Fame
      </h1>

      {Object.keys(grouped).length === 0 && (
        <p className="text-ink/60">Još nema zabilježenih pobjednika.</p>
      )}

      {Object.entries(medalsBySeason).map(([seasonId, medals]) => {
        const season = medals[0]!.season;
        return (
          <section key={seasonId} className="mb-8">
            <h2 className="mb-3 font-display text-lg font-bold text-navy">
              Medalje konačnog poretka —{" "}
              {season.system === "GP" ? "Dubrovnik GP" : "Akademija"}{" "}
              {season.yearLabel}
            </h2>
            <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
              {[...medals]
                .sort(
                  (a, b) =>
                    MEDAL_PRIORITY.indexOf(a.category) -
                      MEDAL_PRIORITY.indexOf(b.category) || a.place - b.place
                )
                .map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    <MedalDisc category={m.category} place={m.place} />
                    <Link
                      href={`/igraci/${m.player.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-navy hover:underline"
                    >
                      {m.player.lastName} {m.player.firstName}
                    </Link>
                    <span className="shrink-0 text-xs text-ink/60">
                      {m.category === "UKUPNO"
                        ? `${m.place}. mjesto`
                        : m.place === 1
                          ? `najbolji ${m.category === "ZENE" ? "— igračica" : m.category}`
                          : `${m.category} — ${m.place}. mjesto`}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        );
      })}

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(grouped).map(([key, group]) => (
          <div key={key} className="rounded-lg border border-navy/10 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <span className={group.season.system === "AKADEMIJA" ? "text-academy" : "text-navy"}>
                {group.season.system === "GP" ? "Dubrovnik GP" : "Akademija"}
              </span>{" "}
              {group.season.yearLabel} · {group.items[0]?.categoryCode}
            </p>
            <ol className="grid gap-2">
              {group.items.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span
                    className="rank-badge"
                    data-parity={e.place % 2 === 0 ? "even" : "odd"}
                    data-place={e.place === 1 ? "1" : undefined}
                  >
                    {e.place}
                  </span>
                  <span className="font-medium text-navy">
                    <PlayerName
                      id={e.player.id}
                      firstName={e.player.firstName}
                      lastName={e.player.lastName}
                      isClubMember={e.player.isClubMember}
                    />
                  </span>
                  <span className="ml-auto font-mono text-sm text-ink/50">
                    {e.pointsTotal}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
