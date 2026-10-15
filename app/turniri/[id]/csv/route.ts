import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { csvFileName, csvResponse, toCsv } from "@/lib/csv";
import { bezNule, rejtinziNaDatum } from "@/lib/ratings/na-datum";
import { prikazanaTitula } from "@/lib/players/titula";
import type { Title } from "@prisma/client";

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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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

  // Isti izvor kao na stranici turnira: rejting na dan turnira, a ne
  // današnji. Vidi lib/ratings/na-datum.ts.
  const rejtinziTada = await rejtinziNaDatum({
    playerIds: tournament.results.map((r) => r.playerId),
    tempo: tournament.tempo,
    datum: tournament.date,
  });

  /** Titula za ispis: iz trenutka spremanja, a bez titule je prazna ćelija. */
  const titula = (r: {
    titleSnapshotUsed: Title | null;
    player: { title: Title };
  }): string => {
    const t = prikazanaTitula(r.titleSnapshotUsed, r.player.title);
    return t === "NONE" ? "" : t;
  };

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
      // Kao na stranici turnira: titula iz trenutka spremanja rezultata.
      titula(r),
      `${r.player.lastName} ${r.player.firstName}`,
      bezNule(r.ratingSnapshotUsed) ?? rejtinziTada.get(r.playerId) ?? "",
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
