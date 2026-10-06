import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSeason, recomputeSeasonMedals } from "../actions";
import { SeasonForm } from "../season-form";
import { getSeasonMedals } from "@/lib/akademija/medals";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { MEDAL_PRIORITY } from "@/lib/scoring/akademija/medals";

export default async function EditSeasonPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const season = await prisma.season.findUnique({ where: { id: params.id } });
  if (!season) notFound();

  const boundUpdateSeason = updateSeason.bind(null, season.id);

  const seasonMedals =
    season.system === "AKADEMIJA" ? await getSeasonMedals(season.id) : [];

  /**
   * Dijeljena mjesta na konačnoj ljestvici (čl. 15 st. 6).
   *
   * Izračun medalja takvo mjesto preskače — pravilnik kaže da igrači dijele
   * mjesto, ali ne i kome pripada medalja. Zato ovdje stoji popis: admin vidi
   * koga se tiče i može medalju dodijeliti ručno, uz obrazloženje.
   */
  const dijeljenaMjesta =
    season.system === "AKADEMIJA"
      ? ((await getAkademijaStandings(season.id)) ?? [])
          .filter((row) => row.sharedPlace)
          .map((row) => ({
            place: row.place,
            name: `${row.player.lastName} ${row.player.firstName}`,
          }))
      : [];

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Uredi sezonu — {season.yearLabel}
      </h2>
      <SeasonForm
        action={boundUpdateSeason}
        defaultValues={{
          system: season.system,
          yearLabel: season.yearLabel,
          startDate: season.startDate,
          endDate: season.endDate,
          isActive: season.isActive,
          rulebookVersion: season.rulebookVersion,
        }}
      />

      {season.system === "AKADEMIJA" && (
        <section className="mt-8">
          <h3 className="font-display font-bold text-navy">
            Medalje konačnog poretka (čl. 19 st. 3)
          </h3>
          <p className="mb-3 max-w-prose text-xs text-ink/60">
            Računaju se iz konačne ljestvice sezone, pa ih treba pokrenuti tek
            kad su svi turniri odigrani i rezultati uneseni. Ponovni izračun
            ne dira ručno dodijeljene medalje.
          </p>

          {seasonMedals.length > 0 ? (
            <ul className="mb-3 divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white text-sm">
              {[...seasonMedals]
                .sort(
                  (a, b) =>
                    MEDAL_PRIORITY.indexOf(a.category) -
                      MEDAL_PRIORITY.indexOf(b.category) || a.place - b.place
                )
                .map((m) => (
                  <li
                    key={`${m.category}-${m.place}`}
                    className="flex justify-between gap-3 px-4 py-2"
                  >
                    <span className="text-navy">{m.playerName}</span>
                    <span className="text-xs text-ink/60">
                      {m.category === "UKUPNO"
                        ? `${m.place}. mjesto`
                        : `${m.category} — ${m.place}. mjesto`}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-ink/60">
              Medalje konačnog poretka još nisu izračunate.
            </p>
          )}

          {dijeljenaMjesta.length > 0 && (
            <div className="mb-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-navy">
              <p className="font-semibold">
                Dijeljena mjesta — izračun ih preskače
              </p>
              <p className="mt-1 max-w-prose">
                Po čl. 15 st. 6 ovi igrači dijele mjesto. Pravilnik ne kaže
                kome u tom slučaju pripada medalja, pa je izračun ne
                dodjeljuje; dodijeli je ručno ako Klub tako odluči.
              </p>
              <ul className="mt-1">
                {dijeljenaMjesta.map((d) => (
                  <li key={`${d.place}-${d.name}`}>
                    {d.place}. mjesto — {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await recomputeSeasonMedals(season.id);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Izračunaj medalje konačnog poretka
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
