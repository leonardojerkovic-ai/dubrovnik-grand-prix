import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { RankBadge } from "@/components/rank-badge";

/**
 * Naslovnica: hero je stvarni, koristan sadržaj (nadolazeći turniri), ne
 * marketinški banner. Dohvaća SVE aktivne sezone (GP i/ili Akademija mogu
 * biti aktivne istovremeno) i kombinira njihove turnire kronološki.
 */
export default async function HomePage() {
  const activeSeasons = await prisma.season.findMany({
    where: { isActive: true },
    include: { tournaments: { orderBy: { date: "asc" } } },
  });

  const upcomingTournaments = activeSeasons
    .flatMap((season) =>
      season.tournaments.map((t) => ({ ...t, seasonSystem: season.system }))
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const gpSeason = activeSeasons.find((s) => s.system === "GP");
  const akademijaSeason = activeSeasons.find((s) => s.system === "AKADEMIJA");
  const primaryLjestvicaHref = gpSeason ? "/ljestvice/opci-gp" : "/ljestvice/akademija";

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-paper">
        <div className="absolute inset-0 bg-checker-pattern bg-[length:40px_40px] opacity-[0.04]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mb-6 flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="ŠK Dubrovnik Grand Prix"
              width={112}
              height={112}
              className="h-24 w-24 md:h-28 md:w-28"
              priority
            />
            {akademijaSeason && (
              <Image
                src="/logo-akademija.png"
                alt="ŠK Dubrovnik Akademija"
                width={112}
                height={112}
                className="h-24 w-24 md:h-28 md:w-28"
              />
            )}
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {gpSeason && (
              <span className="badge-title">Dubrovnik GP — sezona {gpSeason.yearLabel}</span>
            )}
            {akademijaSeason && (
              <span className="badge-title bg-academy/20 text-paper">
                Akademija — sezona {akademijaSeason.yearLabel}
              </span>
            )}
            {!gpSeason && !akademijaSeason && (
              <span className="badge-title">Dubrovnik Grand Prix</span>
            )}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold max-w-2xl">
            Cijela sezona. Jedna ljestvica. Svaki potez se broji.
          </h1>
          <p className="mt-4 max-w-xl text-sky-light">
            Pratite poredak Općeg GP-a i svih kategorijskih ljestvica ŠK
            Dubrovnik kroz cijelu natjecateljsku sezonu.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href={primaryLjestvicaHref}
              className="rounded-md bg-gold px-5 py-3 font-semibold text-navy hover:bg-gold-light transition-colors"
            >
              Pogledaj ljestvicu
            </Link>
            <Link
              href="/kalendar"
              className="rounded-md border border-paper/30 px-5 py-3 font-semibold hover:bg-paper/10 transition-colors"
            >
              Kalendar turnira
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-navy mb-6">
          Nadolazeći turniri
        </h2>
        {upcomingTournaments.length > 0 ? (
          <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
            {upcomingTournaments.map((t, i) => (
              <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                <RankBadge place={i + 1} />
                <div className="flex-1">
                  <p className="font-semibold text-navy">{t.name}</p>
                  <p className="text-sm text-ink/60">
                    {t.date.toLocaleDateString("hr-HR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`badge-title ${t.seasonSystem === "AKADEMIJA" ? "bg-academy/20 text-academy" : ""}`}
                >
                  {t.seasonSystem === "AKADEMIJA" ? "Akademija" : t.level ?? t.tempo}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/60">
            Kalendar sezone još nije objavljen. Provjerite uskoro.
          </p>
        )}
      </section>
    </div>
  );
}
