import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  sortPlayersByRatingTitleSurname,
  type SortablePlayerEntry,
} from "@/lib/players/sort";
import { PlayerName } from "@/components/player-name";
import { RegisterButton } from "@/components/register-button";
import { MedalList } from "@/components/medal-list";
import { CsvDownload } from "@/components/csv-download";
import { ObjectionNote } from "@/components/objection-note";
import { objectionDeadline } from "@/lib/scoring/results-lock";
import { PrizeList } from "@/components/prize-list";
import { getTournamentPrizes } from "@/lib/tournament-prizes";
import { getTournamentMedals } from "@/lib/akademija/medals";
import {
  bezNule,
  rejtinziNaDatum,
  tempoKaoPolje,
} from "@/lib/ratings/na-datum";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

const LEVEL_LABELS: Record<string, string> = {
  KLUPSKA: "Klupska",
  NATJECATELJSKA: "Natjecateljska",
  VRHUNSKA: "Vrhunska",
};

const TEMPO_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  RAPID: "Rapid / ubrzani",
  BLITZ: "Blitz / brzopotezni",
};

function formatTimeControl(baseMinutes: number | null, incrementSeconds: number | null) {
  if (baseMinutes == null) return null;
  const inc = incrementSeconds ?? 0;
  return `${baseMinutes} min${inc > 0 ? ` + ${inc} sek/potez` : ""}`;
}

type PlayerEntry = SortablePlayerEntry & {
  id: string;
  isClubMember: boolean;
  rank: number | null;
  gpPoints: number | null;
  /**
   * Prikazani rejting NIJE onaj s kojim je računat F_R: pri unosu rezultata
   * polje je ostalo prazno, pa je u prosjek ušlo 1400 (čl. 7). Uz broj stoji
   * zvjezdica, jer bi inače prikaz tvrdio nešto što nije ušlo u izračun.
   */
  neocijenjenUIzracunu: boolean;
};

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true, date: true },
  });
  if (!tournament) return {};
  return {
    title: tournament.name,
    description: `Detalji, prijavljeni igrači i rezultati turnira ${tournament.name} (${tournament.date.toLocaleDateString("hr-HR")}).`,
  };
}

export default async function TournamentDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      season: true,
      registrations: {
        where: { status: "PRIJAVLJEN" },
        include: { player: { include: { ratingsCurrent: true } } },
      },
      // Igrače koje je admin unio kroz rezultate (npr. odigrani turnir bez
      // da su se svi prethodno samostalno prijavili online) treba prikazati
      // isto kao i one koji su se sami prijavili — spajamo oba izvora niže.
      results: {
        include: { player: { include: { ratingsCurrent: true } } },
      },
    },
  });

  if (!tournament) notFound();

  const ratingField = tempoKaoPolje(tournament.tempo);

  // Rejting uz ime znači „rejting na dan turnira", ne današnji. Inače bi se
  // tablica odigranog turnira mijenjala svaki put kad FIDE objavi novu
  // listu — i to tiho, bez ijednog traga.
  const sviIgraci = [
    ...tournament.registrations.map((r) => r.player.id),
    ...tournament.results.map((r) => r.player.id),
  ];
  const rejtinziTada = await rejtinziNaDatum({
    playerIds: Array.from(new Set(sviIgraci)),
    tempo: tournament.tempo,
    datum: tournament.date,
  });

  /**
   * Prvi izbor je vrijednost koja je stvarno ušla u izračun bodova. Ako je
   * nema, uzima se snimak s dana turnira. Današnji rejting ostaje samo za
   * turnire koji se tek igraju, gdje snimka još nema.
   */
  function rejtingZa(playerId: string, uRezultatu: number | null | undefined) {
    const izRezultata = bezNule(uRezultatu);
    if (izRezultata !== null) return izRezultata;
    const tada = rejtinziTada.get(playerId);
    if (tada !== undefined) return tada;
    return null;
  }

  // Spoji igrače iz samoprijava I admin-unesenih rezultata, po playerId
  // (bez duplikata) — rezultat (rank/bodovi), ako postoji, ide uz igrača.
  const playerMap = new Map<string, PlayerEntry>();

  for (const r of tournament.registrations) {
    playerMap.set(r.player.id, {
      id: r.player.id,
      firstName: r.player.firstName,
      lastName: r.player.lastName,
      title: r.player.title,
      isClubMember: r.player.isClubMember,
      rating:
        rejtingZa(r.player.id, null) ??
        bezNule(r.player.ratingsCurrent?.[ratingField]),
      rank: null,
      gpPoints: null,
      neocijenjenUIzracunu: false,
    });
  }

  for (const res of tournament.results) {
    playerMap.set(res.player.id, {
      id: res.player.id,
      firstName: res.player.firstName,
      lastName: res.player.lastName,
      title: res.player.title,
      isClubMember: res.player.isClubMember,
      rating: rejtingZa(res.player.id, res.ratingSnapshotUsed),
      rank: res.rank,
      gpPoints: res.gpPoints,
      // Samo GP: u Akademiji rejting ne ulazi u formulu (čl. 5 Akademije),
      // pa se ni ne može razilaziti s izračunom.
      neocijenjenUIzracunu:
        tournament.season.system === "GP" &&
        bezNule(res.ratingSnapshotUsed) === null &&
        rejtinziTada.get(res.player.id) != null,
    });
  }

  const sortedPlayers = sortPlayersByRatingTitleSurname(Array.from(playerMap.values()));
  // Ako turnir ima unesene rezultate, prirodnije je poredati po plasmanu
  // (rank) nego po rejtingu — rezultat je "istinitiji" pokazatelj od
  // prijave. Rejting-sort i dalje vrijedi za igrače bez rezultata (koji su
  // samo prijavljeni, turnir se još nije odigrao).
  const hasAnyResults = tournament.results.length > 0;

  // Nakon turnira prvo što čovjek poželi jest vidjeti gdje je sada na
  // ljestvici. Akademija ima jednu, GP osam — vodimo na Opći.
  const isAkademija = tournament.season.system === "AKADEMIJA";

  // Medalje postoje samo u Akademiji (čl. 19); za GP turnire popis je prazan.
  const medals = isAkademija ? await getTournamentMedals(tournament.id) : [];

  // Nagrade postoje samo na turnirima glavnog GP-a; Akademija ima medalje
  // propisane pravilnikom (čl. 19), pa se ta dva popisa ne miješaju.
  const prizes = isAkademija ? [] : await getTournamentPrizes(tournament.id);
  const standingsHref = isAkademija ? "/ljestvice/akademija" : "/ljestvice/opci-gp";
  const standingsLabel = isAkademija ? "Ljestvica Akademije" : "Ljestvica Općeg GP-a";
  const displayPlayers = hasAnyResults
    ? [...sortedPlayers].sort((a, b) => {
        if (a.rank == null && b.rank == null) return 0;
        if (a.rank == null) return 1; // bez rezultata idu na kraj
        if (b.rank == null) return -1;
        return a.rank - b.rank;
      })
    : sortedPlayers;

  const timeControl = formatTimeControl(tournament.baseMinutes, tournament.incrementSeconds);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-2">
        <span
          className={`badge-title ${tournament.season.system === "AKADEMIJA" ? "bg-academy/15 text-academy" : ""}`}
        >
          {tournament.season.system === "GP" ? "Dubrovnik GP" : "GP Akademije"} — sezona{" "}
          {tournament.season.yearLabel}
        </span>
        {tournament.isFinal && <span className="badge-title ml-2">Finale</span>}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">
          {tournament.name}
        </h1>
        {tournament.status === "PRIJAVE_OTVORENE" && (
          <RegisterButton tournamentId={tournament.id} />
        )}
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-4 rounded-lg border border-navy/10 bg-white p-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Datum</dt>
          <dd className="font-medium text-navy">
            {tournament.date.toLocaleDateString("hr-HR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {tournament.startTime ? ` u ${tournament.startTime}` : ""}
          </dd>
        </div>
        {tournament.venue && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Mjesto</dt>
            <dd className="font-medium text-navy">{tournament.venue}</dd>
          </div>
        )}
        {tournament.level && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Razina</dt>
            <dd className="font-medium text-navy">{LEVEL_LABELS[tournament.level]}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Tempo</dt>
          <dd className="font-medium text-navy">{TEMPO_LABELS[tournament.tempo]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">
            Vrijeme razmišljanja
          </dt>
          <dd className="font-medium text-navy font-mono">
            {timeControl ?? "nije objavljeno"}
          </dd>
        </div>
      </dl>

      {tournament.announcementUrl && (
        <a
          href={tournament.announcementUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-block rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          Raspis turnira
        </a>
      )}

      <h2 className="font-display text-lg font-bold text-navy mb-3">
        {hasAnyResults ? "Rezultati" : "Prijavljeni igrači"} ({displayPlayers.length}
        {hasAnyResults ? " igrača" : ""})
      </h2>

      {displayPlayers.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-muted">
          Još nema prijava za ovaj turnir.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-4 py-2">Igrač</th>
                <th className="px-4 py-2 text-right font-mono">Rejting</th>
                {hasAnyResults && (
                  <th className="px-4 py-2 text-right font-mono">GP bodovi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {displayPlayers.map((p, i) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-muted font-mono">
                    {p.rank ?? i + 1}.
                  </td>
                  <td className="px-4 py-2 font-medium text-navy">
                    <PlayerName {...p} />
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {p.rating ?? "—"}
                    {p.neocijenjenUIzracunu && (
                      <span className="ml-0.5 text-crimson" title="U izračun bodova ušao kao neocijenjen (1400, čl. 7).">
                        *
                      </span>
                    )}
                  </td>
                  {hasAnyResults && (
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {p.gpPoints ?? "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayPlayers.some((p) => p.neocijenjenUIzracunu) && (
        <p className="mt-2 text-xs text-subtle">
          <span className="text-crimson">*</span> Rejting je uz ime prikazan s
          liste koja je vrijedila na dan turnira, ali u izračun bodova igrač je
          ušao kao neocijenjen (1400, čl. 7) — pri unosu rezultata polje je
          ostalo prazno.
        </p>
      )}

      {/*
        Redoslijed nije proizvoljan: medalje i nagrade dio su rezultata pa
        stoje odmah uz njih, preuzimanje je radnja nad tom tablicom, a
        napomena o roku zatvara cjelinu.
      */}
      {medals.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-navy mb-3">
            Dodijeljene medalje
          </h2>
          <MedalList items={medals} />
        </section>
      )}

      {prizes.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-navy mb-3">
            Dodijeljene nagrade
          </h2>
          <PrizeList items={prizes} />
        </section>
      )}

      {hasAnyResults && (
        <CsvDownload
          href={`/turniri/${tournament.id}/csv`}
          label="Preuzmi rezultate (CSV)"
        />
      )}

      {hasAnyResults && (
        <ObjectionNote
          deadline={
            tournament.resultsPublishedAt
              ? objectionDeadline(tournament.resultsPublishedAt)
              : null
          }
        />
      )}

      {hasAnyResults && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href={standingsHref}
            className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            {standingsLabel} →
          </Link>
          {/*
            Gosti izvan kluba redovito pitaju zašto ih nema na ljestvici.
            Bodovi im se računaju (čl. 4), ali se ljestvica vodi za članove.
          */}
          <p className="text-xs text-muted">
            Bodovi se računaju svim igračima, ali se na službenoj ljestvici
            prikazuju samo članovi ŠK Dubrovnik (čl. 4).
          </p>
        </div>
      )}
    </div>
  );
}
