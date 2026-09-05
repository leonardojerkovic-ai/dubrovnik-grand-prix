import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  sortPlayersByRatingTitleSurname,
  type SortablePlayerEntry,
} from "@/lib/players/sort";
import { PlayerName } from "@/components/player-name";
import { RegisterButton } from "@/components/register-button";

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
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
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

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const ratingField =
    tournament.tempo === "STANDARD"
      ? "standard"
      : tournament.tempo === "RAPID"
        ? "rapid"
        : "blitz";

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
      rating: r.player.ratingsCurrent?.[ratingField] ?? null,
      rank: null,
      gpPoints: null,
    });
  }

  for (const res of tournament.results) {
    const existing = playerMap.get(res.player.id);
    playerMap.set(res.player.id, {
      id: res.player.id,
      firstName: res.player.firstName,
      lastName: res.player.lastName,
      title: res.player.title,
      isClubMember: res.player.isClubMember,
      rating: existing?.rating ?? res.player.ratingsCurrent?.[ratingField] ?? null,
      rank: res.rank,
      gpPoints: res.gpPoints,
    });
  }

  const sortedPlayers = sortPlayersByRatingTitleSurname(Array.from(playerMap.values()));
  // Ako turnir ima unesene rezultate, prirodnije je poredati po plasmanu
  // (rank) nego po rejtingu — rezultat je "istinitiji" pokazatelj od
  // prijave. Rejting-sort i dalje vrijedi za igrače bez rezultata (koji su
  // samo prijavljeni, turnir se još nije odigrao).
  const hasAnyResults = tournament.results.length > 0;
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
          <dt className="text-xs uppercase tracking-wide text-ink/40">Datum</dt>
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
            <dt className="text-xs uppercase tracking-wide text-ink/40">Mjesto</dt>
            <dd className="font-medium text-navy">{tournament.venue}</dd>
          </div>
        )}
        {tournament.level && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink/40">Razina</dt>
            <dd className="font-medium text-navy">{LEVEL_LABELS[tournament.level]}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink/40">Tempo</dt>
          <dd className="font-medium text-navy">{TEMPO_LABELS[tournament.tempo]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink/40">
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
        {hasAnyResults ? "Sudionici" : "Prijavljeni igrači"} ({displayPlayers.length})
      </h2>

      {displayPlayers.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Još nema prijava za ovaj turnir.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
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
                  <td className="px-3 py-2 text-ink/50 font-mono">
                    {p.rank ?? i + 1}.
                  </td>
                  <td className="px-4 py-2 font-medium text-navy">
                    <PlayerName {...p} />
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {p.rating ?? 0}
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
    </div>
  );
}
