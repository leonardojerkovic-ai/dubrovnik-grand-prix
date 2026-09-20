import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSeason, recomputeSeasonMedals } from "../actions";
import { SeasonForm } from "../season-form";
import { getSeasonMedals } from "@/lib/akademija/medals";
import { MEDAL_PRIORITY } from "@/lib/scoring/akademija/medals";

export default async function EditSeasonPage({
  params,
}: {
  params: { id: string };
}) {
  const season = await prisma.season.findUnique({ where: { id: params.id } });
  if (!season) notFound();

  const boundUpdateSeason = updateSeason.bind(null, season.id);

  const seasonMedals =
    season.system === "AKADEMIJA" ? await getSeasonMedals(season.id) : [];

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
            <p className="mb-3 text-sm text-ink/50">
              Medalje konačnog poretka još nisu izračunate.
            </p>
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
