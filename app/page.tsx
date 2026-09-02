import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

/**
 * Naslovnica: hero je stvarni, koristan sadržaj (nadolazeći turniri), ne
 * marketinški banner. Dohvaća SVE aktivne sezone (GP i/ili Akademija mogu
 * biti aktivne istovremeno) i kombinira njihove turnire kronološki.
 */
const TEMPO_LABELS: Record<string, string> = {
  STANDARD: "standard",
  RAPID: "rapid",
  BLITZ: "blitz",
};

const LEVEL_LABELS: Record<string, string> = {
  KLUPSKA: "Klupska",
  NATJECATELJSKA: "Natjecateljska",
  VRHUNSKA: "Vrhunska",
};

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
        <div className="absolute inset-0 bg-checker-pattern bg-[length:72px_72px] opacity-[0.10]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          {/*
            Dekorativni grb u desnoj polovici hera, koja je inače prazna.
            Usidren je za sadržajni spremnik, ne za rub prozora, pa ostaje
            na mjestu i na širokim ekranima. Skriven čitačima ekrana —
            čitljiv grb s opisom stoji gore uz naslov.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 hidden w-[300px] -translate-y-1/2 opacity-[0.16] lg:block xl:w-[360px]"
          >
            <Image src="/grb.png" alt="" width={360} height={360} />
          </div>

          <div className="mb-5">
            <Image
              src="/grb.png"
              alt="Grb Dubrovnik Grand Prixa"
              width={200}
              height={200}
              className="h-16 w-16 md:h-20 md:w-20"
              priority
            />
          </div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold">
            Šahovski klub Dubrovnik · osnovan 1933.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {gpSeason && (
              <span className="badge-title border border-paper/30 bg-paper/10 text-paper">
                Dubrovnik GP — sezona {gpSeason.yearLabel}
              </span>
            )}
            {akademijaSeason && (
              <span className="badge-title border border-gold bg-gold text-navy-dark">
                Akademija — sezona {akademijaSeason.yearLabel}
              </span>
            )}
            {!gpSeason && !akademijaSeason && (
              <span className="badge-title">Dubrovnik Grand Prix</span>
            )}
          </div>
          <h1 className="font-hero text-4xl md:text-6xl max-w-2xl leading-[1.08] lg:max-w-[36rem]">
            Cijela sezona. Jedna ljestvica.{" "}
            <span className="italic text-gold-light">Svaki potez se broji.</span>
          </h1>
          <span className="mt-6 block h-0.5 w-10 bg-gold" />
          <p className="mt-5 max-w-xl text-sky-light">
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
        <h2 className="font-hero mb-4 text-2xl text-navy">
          Nadolazeći turniri
        </h2>
        {upcomingTournaments.length > 0 ? (
          <ul className="border-t border-navy/20">
            {upcomingTournaments.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-4 border-b border-navy/[0.07] px-1 py-3.5"
              >
                {/*
                  Datum je vodeći podatak, ne redni broj u popisu. Prije je
                  ovdje stajala značka za mjesto na ljestvici, koja ovdje ima
                  posve drugo značenje.
                */}
                <div className="w-12 flex-shrink-0 text-center">
                  <div className="font-hero text-xl leading-none text-navy">
                    {t.date.getDate()}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-ink/45">
                    {t.date.toLocaleDateString("hr-HR", { month: "short" })}
                  </div>
                </div>
                <div className="flex-1">
                  <Link
                    href={`/turniri/${t.id}`}
                    className="font-medium text-navy hover:text-crimson hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="text-xs text-ink/50">
                    {[
                      TEMPO_LABELS[t.tempo] ?? t.tempo.toLowerCase(),
                      t.rounds ? `${t.rounds} kola` : null,
                      t.date.getFullYear() !== new Date().getFullYear()
                        ? `${t.date.getFullYear()}.`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span
                  className={`badge-title ${t.seasonSystem === "AKADEMIJA" ? "bg-academy/10 text-academy" : ""}`}
                >
                  {t.seasonSystem === "AKADEMIJA"
                    ? "Akademija"
                    : LEVEL_LABELS[t.level ?? ""] ?? t.level ?? t.tempo}
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
