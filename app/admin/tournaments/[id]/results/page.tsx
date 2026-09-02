import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResultsForm } from "./results-form";
import { LockBanner } from "./lock-banner";
import { getLockStatus } from "@/lib/scoring/results-lock";

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
