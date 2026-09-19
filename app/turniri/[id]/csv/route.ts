import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { csvFileName, csvResponse, toCsv } from "@/lib/csv";

/**
 * Izvoz rezultata turnira u CSV.
 *
 * Uz plasman i bodove izvozi se i rejting koji je ušao u izračun te oznaka
 * članstva na dan turnira. Oboje je potrebno da se izvezeni redak može
 * provjeriti po pravilniku: rejting određuje F_R (čl. 24), a članstvo na dan
 * turnira odlučuje ulazi li rezultat na klupsku ljestvicu (čl. 4).
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      season: true,
      results: {
        orderBy: { rank: "asc" },
        include: {
          player: {
            select: { firstName: true, lastName: true, title: true },
          },
        },
      },
    },
  });

  if (!tournament) notFound();

  const csv = toCsv(
    [
      "Plasman",
      "Titula",
      "Prezime i ime",
      "Rejting",
      "GP bodovi",
      "Odigrao",
      "Član na dan turnira",
    ],
    tournament.results.map((r) => [
      r.rank,
      r.player.title === "NONE" ? "" : r.player.title,
      `${r.player.lastName} ${r.player.firstName}`,
      r.ratingSnapshotUsed ?? "",
      r.gpPoints ?? "",
      r.gamesPlayed ? "da" : "ne",
      r.wasClubMember ? "da" : "ne",
    ])
  );

  return csvResponse(
    csvFileName(tournament.name, tournament.season.yearLabel),
    csv
  );
}
