import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSeasonOverview } from "@/lib/season-overview";

const TEMPO: Record<string, string> = {
  STANDARD: "standard",
  RAPID: "rapid",
  BLITZ: "blitz",
};
const LEVEL: Record<string, string> = {
  KLUPSKA: "klupska",
  NATJECATELJSKA: "natjecateljska",
  VRHUNSKA: "vrhunska",
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "short" }).format(d);
}

export default async function SeasonOverviewPage({
  searchParams,
}: {
  searchParams?: { sezona?: string };
}) {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, yearLabel: true, system: true, isActive: true },
  });

  const selectedId = searchParams?.sezona ?? seasons[0]?.id;
  const overview = selectedId ? await getSeasonOverview(selectedId) : null;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-navy mb-1">
        Pregled sezone
      </h2>
      <p className="mb-4 max-w-3xl text-sm text-ink/60">
        Što iz trenutnih podataka stvarno proizlazi — koliko turnira ulazi u
        koju ljestvicu i koje kvote iz toga slijede. Usporedi s prilogom
        pravilnika; ako se brojke ne poklapaju, negdje je krivo označen turnir.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {seasons.map((s) => (
          <Link
            key={s.id}
            href={`/admin/pregled-sezone?sezona=${s.id}`}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              s.id === selectedId
                ? "bg-navy text-paper"
                : "border border-navy/20 text-navy hover:bg-navy/5"
            }`}
          >
            {s.yearLabel}
            <span className="ml-1.5 text-xs opacity-70">
              {s.system === "AKADEMIJA" ? "Akademija" : "GP"}
            </span>
          </Link>
        ))}
      </div>

      {!overview ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Nema unesenih sezona.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-md bg-paper px-3 py-2">
              Turnira: <strong className="text-navy">{overview.tournamentCount}</strong>
            </span>
            <span className="rounded-md bg-paper px-3 py-2">
              Redovnih: <strong className="text-navy">{overview.regularCount}</strong>
            </span>
            <span className="rounded-md bg-paper px-3 py-2">
              Završnih: <strong className="text-navy">{overview.finalCount}</strong>
            </span>
            <span className="rounded-md bg-paper px-3 py-2">
              Pravilnik:{" "}
              <strong className="text-navy">
                {overview.rulebookVersion ?? "nije upisan"}
              </strong>
            </span>
          </div>

          {overview.warnings.length > 0 && (
            <section className="mb-8">
              <h3 className="mb-2 text-sm font-semibold text-navy">
                Što treba provjeriti ({overview.warnings.length})
              </h3>
              <ul className="grid gap-2">
                {overview.warnings.map((w, i) => (
                  <li
                    key={i}
                    className={`rounded-md border px-3 py-2.5 text-sm ${
                      w.severity === "greska"
                        ? "border-crimson/30 bg-crimson/5 text-navy"
                        : "border-gold/40 bg-gold/5 text-navy"
                    }`}
                  >
                    {w.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {overview.system === "GP" && (
            <section className="mb-8">
              <h3 className="mb-2 text-sm font-semibold text-navy">
                Ljestvice i kvote
              </h3>
              <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
                    <tr>
                      <th className="px-4 py-3">Ljestvica</th>
                      <th className="px-4 py-3 text-right">Redovnih turnira</th>
                      <th className="px-4 py-3 text-right">Kvota</th>
                      <th className="px-4 py-3">Zaštićeni rezultat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10">
                    {overview.standings.map((s) => (
                      <tr key={s.code} className={s.atMinimum ? "bg-gold/5" : ""}>
                        <td className="px-4 py-3 font-medium text-navy">{s.label}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {s.regularCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-navy">
                          {s.quota}
                        </td>
                        <td className="px-4 py-3 text-ink/60">
                          {s.finals.length > 0 ? s.finals.join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink/50">
                Kvota je polovica redovnih turnira, zaokruženo naviše, najmanje
                5 (čl. 16 i čl. 20 st. 3).
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-navy">
              Turniri i ljestvice u koje ulaze
            </h3>
            {overview.tournaments.length === 0 ? (
              <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
                U ovoj sezoni još nema unesenih turnira.
              </p>
            ) : (
              <div className="divide-y divide-navy/[0.07] rounded-lg border border-navy/10 bg-white">
                {overview.tournaments.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/admin/tournaments/${t.id}`}
                        className="font-medium text-navy hover:text-crimson hover:underline"
                      >
                        {t.name}
                      </Link>
                      <span className="text-xs text-ink/50">
                        {fmt(t.date)} · {TEMPO[t.tempo] ?? t.tempo}
                        {t.level ? ` · ${LEVEL[t.level]}` : ""}
                        {t.isFinal ? " · završni" : ""}
                        {t.restrictionLabel ? ` · samo ${t.restrictionLabel}` : ""}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        t.standings.length === 0 ? "text-crimson" : "text-ink/55"
                      }`}
                    >
                      {t.standings.length === 0
                        ? "Ne ulazi ni u jednu ljestvicu."
                        : `Ulazi u: ${t.standings.join(", ")}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
