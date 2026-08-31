import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateTournament } from "../actions";
import { TournamentForm } from "../tournament-form";

export default async function EditTournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const [tournament, seasons] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: params.id } }),
    prisma.season.findMany({
      orderBy: [{ system: "asc" }, { yearLabel: "desc" }],
      select: { id: true, yearLabel: true, system: true },
    }),
  ]);

  if (!tournament) notFound();

  const boundUpdateTournament = updateTournament.bind(null, tournament.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">
          Uredi turnir — {tournament.name}
        </h2>
        <Link
          href={`/admin/tournaments/${tournament.id}/results`}
          className="text-sm text-navy hover:text-crimson"
        >
          Unos rezultata →
        </Link>
      </div>
      <TournamentForm
        action={boundUpdateTournament}
        seasons={seasons}
        defaultValues={{
          seasonId: tournament.seasonId,
          name: tournament.name,
          date: tournament.date,
          format: tournament.format,
          rounds: tournament.rounds,
          level: tournament.level,
          tempo: tournament.tempo,
          isFinal: tournament.isFinal,
          isJuniorFinal: tournament.isJuniorFinal,
          status: tournament.status,
        }}
      />
    </div>
  );
}
