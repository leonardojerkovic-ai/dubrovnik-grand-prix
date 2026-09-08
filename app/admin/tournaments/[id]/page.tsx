import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateTournament } from "../actions";
import { TournamentForm } from "../tournament-form";
import { CopyTextButton } from "@/components/copy-text-button";
import { buildTournamentAnnouncement } from "@/lib/whatsapp";

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

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://skdubrovnik.hr";
  const announcement = buildTournamentAnnouncement({
    name: tournament.name,
    date: tournament.date,
    startTime: tournament.startTime,
    venue: tournament.venue,
    tempo: tournament.tempo,
    rounds: tournament.rounds,
    level: tournament.level,
    status: tournament.status,
    announcementUrl: tournament.announcementUrl,
    tournamentId: tournament.id,
    baseUrl,
  });

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
      <div className="mb-5">
        <CopyTextButton
          label="Najava za WhatsApp"
          hint="Tekst se sastavlja iz podataka o turniru — datum, mjesto i satnica ne mogu se razići s onim što piše na stranici."
          text={announcement}
        />
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
          baseMinutes: tournament.baseMinutes,
          incrementSeconds: tournament.incrementSeconds,
          restrictedCategories: tournament.restrictedCategories,
          academyPointsOnly: tournament.academyPointsOnly,
          venue: tournament.venue,
          startTime: tournament.startTime,
          announcementUrl: tournament.announcementUrl,
        }}
      />
    </div>
  );
}
