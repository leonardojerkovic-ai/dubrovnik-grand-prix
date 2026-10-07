import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlayerLink } from "@/components/player-link";
import { RegisterButton } from "@/components/register-button";
import { CalendarSubscribe } from "@/components/calendar-subscribe";
import { seasonSlug } from "@/lib/standings/slugs";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Kalendar",
  description:
    "Kalendar i arhiva turnira Dubrovnik Grand Prixa i GP Akademije.",
};

const STATUS_LABELS: Record<string, string> = {
  NAJAVA: "Najava",
  PRIJAVE_OTVORENE: "Prijave otvorene",
  U_TIJEKU: "U tijeku",
  ZAVRSEN: "Završen",
};

const LEVEL_LABELS: Record<string, string> = {
  KLUPSKA: "Klupska",
  NATJECATELJSKA: "Natjecateljska",
  VRHUNSKA: "Vrhunska",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function levelAndTempo(t: { level: string | null; tempo: string }): string {
  const tempo =
    t.tempo === "STANDARD" ? "standard" : t.tempo === "RAPID" ? "rapid" : "blitz";
  return t.level ? `${LEVEL_LABELS[t.level]}, ${tempo}` : tempo;
}

export default async function KalendarPage(props: {
  searchParams?: Promise<{ sezona?: string }>;
}) {
  const searchParams = await props.searchParams;
  /**
   * Zadano se prikazuju samo aktivne sezone. Kalendar je prije ispisivao sve
   * odjednom, što je s dvije sezone još bilo pregledno, a s osam bi bilo osam
   * tablica jedna ispod druge. Arhiva se bira gore, a izbor stoji u adresi pa
   * se može poslati poveznicom i stranica ostaje bez klijentskog JavaScripta.
   */
  const selected = searchParams?.sezona;

  const allSeasons = await prisma.season.findMany({
    orderBy: [{ startDate: "desc" }, { system: "asc" }],
    select: { id: true, yearLabel: true, system: true, isActive: true },
  });

  const showAll = selected === "sve";
  const seasons = await prisma.season.findMany({
    where: showAll
      ? {}
      : selected
        ? { yearLabel: { in: [selected.replace("-", "/"), selected] } }
        : { isActive: true },
    orderBy: [{ system: "asc" }, { startDate: "desc" }],
    include: {
      tournaments: {
        orderBy: { date: "asc" },
        include: {
          _count: { select: { results: true } },
          // Pobjednik je jedini rezultat koji u pregledu arhive nekoga
          // zanima; cijeli poredak je klik dalje, na stranici turnira.
          results: {
            where: { rank: 1 },
            take: 1,
            include: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  isClubMember: true,
                },
              },
            },
          },
        },
      },
    },
  });

  /**
   * Granica je DAN, ne trenutak: turnir koji se igra danas još nije arhiva,
   * a ne nestaje iz nadolazećih u jutarnjim satima. Isto pravilo koristi i
   * naslovnica.
   */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Kalendar
      </h1>
      <p className="mb-6 max-w-prose text-sm text-subtle">
        Nadolazeći turniri i arhiva odigranih, po sezonama. Odigrani turniri
        vode na svoje rezultate.
      </p>

      <CalendarSubscribe />

      {allSeasons.length > 1 && (
        <nav className="mb-8 mt-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Sezona:</span>
          {allSeasons.map((s) => {
            const slug = seasonSlug(s.yearLabel);
            const active = selected
              ? selected === slug
              : s.isActive && !showAll;
            return (
              <Link
                key={s.id}
                href={`/kalendar?sezona=${slug}`}
                className={`rounded-md border px-2 py-1 font-medium ${
                  active
                    ? "border-navy bg-navy text-paper"
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}
              >
                {s.system === "AKADEMIJA" ? "Akademija " : "GP "}
                {s.yearLabel}
              </Link>
            );
          })}
          <Link
            href="/kalendar?sezona=sve"
            className={`rounded-md border px-2 py-1 font-medium ${
              showAll
                ? "border-navy bg-navy text-paper"
                : "border-navy/20 text-navy hover:bg-navy/5"
            }`}
          >
            Sve sezone
          </Link>
        </nav>
      )}

      {seasons.length === 0 && (
        <p className="text-muted">Kalendar još nije objavljen.</p>
      )}

      <div className="grid gap-12">
        {seasons.map((season) => {
          const upcoming = season.tournaments.filter(
            (t) => t.date.getTime() >= today.getTime()
          );
          // Arhiva ide od najnovijeg — tko je gleda, traži zadnji odigrani.
          const played = season.tournaments
            .filter((t) => t.date.getTime() < today.getTime())
            .reverse();

          return (
            <section key={season.id}>
              <h2 className="font-display text-lg font-bold text-navy mb-4">
                <span
                  className={season.system === "AKADEMIJA" ? "text-academy" : ""}
                >
                  {season.system === "GP"
                    ? "Dubrovnik Grand Prix"
                    : "GP Akademije"}
                </span>{" "}
                — sezona {season.yearLabel}
              </h2>

              {season.tournaments.length === 0 && (
                <p className="text-sm text-muted">Nema unesenih turnira.</p>
              )}

              {upcoming.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Predstoji ({upcoming.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
                    <table className="w-full min-w-[44rem] text-sm">
                      <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-4 py-2">Naziv</th>
                          <th className="px-4 py-2">Datum</th>
                          <th className="px-4 py-2">Razina / tempo</th>
                          <th className="px-4 py-2">Mjesto</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-right">Prijava</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/10">
                        {upcoming.map((t) => (
                          <tr key={t.id}>
                            <td className="px-4 py-3 font-medium text-navy">
                              <Link
                                href={`/turniri/${t.id}`}
                                className="hover:underline"
                              >
                                {t.name}
                              </Link>
                              {t.isFinal && (
                                <span className="badge-title ml-2">Finale</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-navy">
                              {formatDate(t.date)}
                            </td>
                            <td className="px-4 py-3 text-subtle">
                              {levelAndTempo(t)}
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {[t.startTime, t.venue].filter(Boolean).join(" · ") ||
                                "—"}
                            </td>
                            <td className="px-4 py-3">
                              {STATUS_LABELS[t.status]}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {t.status === "PRIJAVE_OTVORENE" && (
                                <RegisterButton tournamentId={t.id} size="sm" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {played.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Odigrano ({played.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
                    <table className="w-full min-w-[44rem] text-sm">
                      <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-4 py-2">Naziv</th>
                          <th className="px-4 py-2">Datum</th>
                          <th className="px-4 py-2">Razina / tempo</th>
                          <th className="px-4 py-2 text-right">Igrača</th>
                          <th className="px-4 py-2">Pobjednik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/10">
                        {played.map((t) => {
                          const winner = t.results[0]?.player;
                          return (
                            <tr key={t.id}>
                              <td className="px-4 py-3 font-medium text-navy">
                                <Link
                                  href={`/turniri/${t.id}`}
                                  className="hover:underline"
                                >
                                  {t.name}
                                </Link>
                                {t.isFinal && (
                                  <span className="badge-title ml-2">Finale</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-subtle">
                                {formatDate(t.date)}
                              </td>
                              <td className="px-4 py-3 text-subtle">
                                {levelAndTempo(t)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-subtle">
                                {t._count.results > 0 ? t._count.results : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {winner ? (
                                  <PlayerLink
                                    id={winner.id}
                                    isClubMember={winner.isClubMember}
                                    className="text-navy"
                                  >
                                    {winner.lastName} {winner.firstName}
                                  </PlayerLink>
                                ) : (
                                  <span className="text-xs text-muted">
                                    rezultati još nisu uneseni
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
