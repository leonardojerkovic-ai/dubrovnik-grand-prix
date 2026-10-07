import Link from "next/link";
import Image from "next/image";
import { RegisterButton } from "@/components/register-button";
import { prisma } from "@/lib/prisma";
import { getGpStandings } from "@/lib/standings/gp";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { TournamentCountdown } from "@/components/tournament-countdown";
import {
  StandingsPreview,
  type StandingsPreviewRow,
} from "@/components/standings-preview";

/** Koliko se mjesta pokazuje na naslovnici. */
const PREVIEW_SIZE = 8;

function toPreviewRows(
  rows: {
    player: {
      id: string;
      firstName: string;
      lastName: string;
      title: string;
      isClubMember: boolean;
    };
    place: number;
    sharedPlace: boolean;
    total: number;
  }[]
): StandingsPreviewRow[] {
  return rows.slice(0, PREVIEW_SIZE).map((row) => ({
    playerId: row.player.id,
    name: `${row.player.lastName} ${row.player.firstName}`,
    title: row.player.title,
    isClubMember: row.player.isClubMember,
    place: row.place,
    sharedPlace: row.sharedPlace,
    total: row.total,
  }));
}

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

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

  /**
   * Nadolazeći turniri — od danas nadalje.
   *
   * Prije se popis samo sortirao po datumu i uzimalo prvih pet, bez obzira
   * na to je li turnir odigran. Dok se ništa nije odigralo izgledalo je
   * isto; čim je prvi turnir prošao, ostao je stajati pod naslovom
   * "Nadolazeći".
   *
   * Uspoređuje se po DANU, ne po trenutku: turnir koji se igra danas i dalje
   * je nadolazeći, a ne nestaje s naslovnice u jutarnjim satima.
   */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTournaments = activeSeasons
    .flatMap((season) =>
      season.tournaments.map((t) => ({ ...t, seasonSystem: season.system }))
    )
    .filter((t) => t.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const gpSeason = activeSeasons.find((s) => s.system === "GP");
  const akademijaSeason = activeSeasons.find((s) => s.system === "AKADEMIJA");
  const primaryLjestvicaHref = gpSeason ? "/ljestvice/opci-gp" : "/ljestvice/akademija";

  /*
    Podnaslov navodi samo sustave koji stvarno imaju aktivnu sezonu — kao i
    bedževi i pregled poretka. Dok je tekst bio nepromjenjiv, obećavao je
    poredak Akademije i kad Akademija nije igrala, a ispod toga nije bilo ni
    bedža ni pregleda poretka. Kad nijedan sustav nije aktivan, opisuje
    cijeli sustav.

    Akademija je pritom ravnopravan sustav bodovanja, a ne podskupina Općeg
    GP-a, pa se navodi posebno, a ne kao jedna od kategorijskih ljestvica.
  */
  const podnaslov =
    gpSeason && !akademijaSeason
      ? "Pratite poredak Općeg GP-a i kategorijskih ljestvica ŠK Dubrovnik kroz cijelu natjecateljsku sezonu."
      : akademijaSeason && !gpSeason
        ? "Pratite poredak GP-a Akademije ŠK Dubrovnik kroz cijelu natjecateljsku sezonu."
        : "Pratite poredak Općeg GP-a, kategorijskih ljestvica i GP-a Akademije ŠK Dubrovnik kroz cijelu natjecateljsku sezonu.";

  // Vrh obiju ljestvica. Dohvaća se usporedno jer su to dva neovisna upita.
  // Obje funkcije vraćaju null ako sezona nema ljestvicu, pa se odmah svodi
  // na prazan niz — naslovnica u tom slučaju samo ne prikazuje tu karticu.
  const [gpTopRaw, akademijaTopRaw] = await Promise.all([
    gpSeason ? getGpStandings(gpSeason.id, "OPCI") : Promise.resolve(null),
    akademijaSeason
      ? getAkademijaStandings(akademijaSeason.id)
      : Promise.resolve(null),
  ]);
  const gpTop = toPreviewRows(gpTopRaw ?? []);
  const akademijaTop = toPreviewRows(akademijaTopRaw ?? []);

  // Odbrojava se do prvog turnira koji dolazi, bez obzira kojem sustavu
  // pripada. Vrijeme s poslužitelja ide uz njega da se prvo iscrtavanje na
  // klijentu poklopi — vidi TournamentCountdown.
  const nextTournament = upcomingTournaments[0];
  const serverNowIso = new Date().toISOString();

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
          {/*
            Nadnaslov se na 375 px lomi u dva retka od kad je 12 px: izmjereno
            u Interu, na 0,2em zauzima 367 px, a raspoloživo je 343 (375 minus
            px-4 s obje strane). Razmak slova je zato ispod sm manji (0,1em →
            320 px), a od sm ostaje kakav je bio. Na 320 px se i tako lomi.
          */}
          <p className="mb-3 text-xs uppercase tracking-[0.1em] text-gold sm:tracking-[0.2em]">
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
          {/*
            Svaka recenica je zasebna cjelina koja se ne lomi iznutra, pa se
            prijelom uvijek dogodi izmedu recenica, a ne nasred sintagme.
            Tek od lg naslov ima dovoljno sirine da to bude sigurno; ispod
            toga se lomi prirodno kako ne bi izasao iz okvira.
          */}
          <h1 className="font-hero text-4xl md:text-6xl max-w-2xl leading-[1.08] text-balance">
            <span className="lg:inline-block">Cijela sezona.</span>{" "}
            <span className="lg:inline-block">Jedna ljestvica.</span>{" "}
            <span className="italic text-gold-light lg:inline-block">
              Svaki potez se broji.
            </span>
          </h1>
          <span className="mt-6 block h-0.5 w-10 bg-gold" />
          <p className="mt-5 max-w-xl text-sky-light">{podnaslov}</p>
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

          {nextTournament && (
            <TournamentCountdown
              targetIso={nextTournament.date.toISOString()}
              serverNowIso={serverNowIso}
              name={nextTournament.name}
              href={`/turniri/${nextTournament.id}`}
            />
          )}
        </div>
      </section>

      {(gpTop.length > 0 || akademijaTop.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <h2 className="font-hero mb-4 text-2xl text-navy">
            Trenutni poredak
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {gpSeason && (
              <StandingsPreview
                heading="Opći GP"
                seasonLabel={gpSeason.yearLabel}
                href="/ljestvice/opci-gp"
                rows={gpTop}
              />
            )}
            {akademijaSeason && (
              <StandingsPreview
                heading="GP Akademije"
                seasonLabel={akademijaSeason.yearLabel}
                href="/ljestvice/akademija"
                rows={akademijaTop}
                accent="akademija"
              />
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-hero mb-4 text-2xl text-navy">
          Nadolazeći turniri
        </h2>
        {upcomingTournaments.length > 0 ? (
          <ul className="border-t border-navy/20">
            {upcomingTournaments.map((t) => (
              /*
                Ispod sm je redak mreža s dva stupca: datum i naziv u prvom
                redu, bedž i gumb u drugom, poravnati pod nazivom. U jednom
                flex retku se na 375 px naziv lomio u uski stupac. Od sm je
                raspored isti kao prije — omotač bedža i gumba tada je
                display:contents, pa su oni ponovno izravni članovi flexa.
              */
              <li
                key={t.id}
                className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-2.5 border-b border-navy/[0.07] px-1 py-3.5 sm:flex sm:gap-4"
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
                  <div className="mt-1 text-xs uppercase tracking-widest text-muted">
                    {t.date.toLocaleDateString("hr-HR", { month: "short" })}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/turniri/${t.id}`}
                    className="font-medium text-navy hover:text-crimson hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {[
                      t.startTime ?? null,
                      t.venue ?? null,
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
                <div className="col-start-2 flex flex-wrap items-center gap-2 sm:contents">
                  <span
                    className={`badge-title ${t.seasonSystem === "AKADEMIJA" ? "bg-academy/10 text-academy" : ""}`}
                  >
                    {t.seasonSystem === "AKADEMIJA"
                      ? "Akademija"
                      : LEVEL_LABELS[t.level ?? ""] ?? t.level ?? t.tempo}
                  </span>
                  {t.status === "PRIJAVE_OTVORENE" && (
                    <RegisterButton tournamentId={t.id} size="sm" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">
            Kalendar sezone još nije objavljen. Provjerite uskoro.
          </p>
        )}
      </section>
    </div>
  );
}
