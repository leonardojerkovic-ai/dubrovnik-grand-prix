import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResultsForm } from "./results-form";
import { LockBanner } from "./lock-banner";
import { getLockStatus } from "@/lib/scoring/results-lock";
import { CopyTextButton } from "@/components/copy-text-button";
import { buildResultsAnnouncement } from "@/lib/whatsapp";

export default async function TournamentResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const [tournament, players] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      include: { season: true, results: { orderBy: { rank: "asc" } } },
    }),
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  if (!tournament) notFound();

  const playerOptions = players.map((p) => ({
    id: p.id,
    label: `${p.lastName} ${p.firstName}`,
  }));

  const initialRows = tournament.results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    rating: r.ratingSnapshotUsed,
    gamesPlayed: r.gamesPlayed,
  }));

  const lock = getLockStatus(tournament);

  // Objava za WhatsApp ima smisla tek kad rezultati postoje.
  const playedResults = tournament.results.filter((r) => r.gamesPlayed);
  const playerById = new Map(players.map((p) => [p.id, p]));
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://skdubrovnik.hr";

  const resultsMessage =
    playedResults.length > 0
      ? buildResultsAnnouncement({
          name: tournament.name,
          date: tournament.date,
          playerCount: playedResults.length,
          tournamentId: tournament.id,
          baseUrl,
          results: playedResults.map((r) => {
            const p = playerById.get(r.playerId);
            return {
              rank: r.rank,
              firstName: p?.firstName ?? "",
              lastName: p?.lastName ?? "",
              gpPoints: r.gpPoints,
            };
          }),
        })
      : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">
            Rezultati — {tournament.name}
          </h2>
          <p className="text-sm text-ink/60">
            {tournament.season.system === "GP" ? "Dubrovnik GP" : "GP Akademije"}{" "}
            · {tournament.season.yearLabel} ·{" "}
            {tournament.date.toLocaleDateString("hr-HR")}
          </p>
        </div>
        <Link
          href={`/admin/tournaments/${tournament.id}`}
          className="text-sm text-navy hover:text-crimson"
        >
          ← Uredi podatke turnira
        </Link>
      </div>

      {resultsMessage && (
        <div className="mb-4">
          <CopyTextButton
            label="Rezultati za WhatsApp"
            hint="Prvih pet mjesta s bodovima i poveznica na cijeli poredak."
            text={resultsMessage}
          />
        </div>
      )}

      <LockBanner
        tournamentId={tournament.id}
        status={lock}
        unlockReason={tournament.unlockReason}
        unlockedByEmail={tournament.unlockedByEmail}
      />

      <ResultsForm
        tournamentId={tournament.id}
        players={playerOptions}
        initialRows={initialRows}
        editable={lock.editable}
      />
    </div>
  );
}
