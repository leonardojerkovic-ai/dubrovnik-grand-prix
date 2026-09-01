"use server";

import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveTournamentResults, type ResultRow } from "./actions";

export type FinalizeState = { message?: string; error?: string };

/** Završni workflow: validira spremljene rezultate, ponovno obračuna bodove,
 * zatim zaključava svaki rezultat i turnir. ZAVRSEN je terminalno stanje UI-a. */
export async function finalizeTournamentResults(tournamentId: string): Promise<FinalizeState> {
  await requireAdmin();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { season: true, results: true },
  });
  if (!tournament) return { error: "Turnir nije pronađen." };
  if (tournament.status === "ZAVRSEN") return { error: "Turnir je već zaključen." };

  const played = tournament.results.filter((r) => r.gamesPlayed);
  const minimum = tournament.season.system === "GP" ? 6 : 7;
  if (played.length < minimum) {
    return { error: `Nema dovoljno odigranih igrača za zaključavanje (${played.length}/${minimum}).` };
  }
  if (played.some((r) => !Number.isInteger(r.rank) || r.rank < 1)) return { error: "Postoji nevaljan plasman." };
  if (new Set(played.map((r) => r.rank)).size !== played.length) return { error: "Postoje duplicirani plasmani." };
  if (new Set(played.map((r) => r.playerId)).size !== played.length) return { error: "Isti igrač postoji više puta u rezultatima." };
  if (played.some((r) => r.ratingSnapshotUsed !== null && r.ratingSnapshotUsed <= 0)) return { error: "Postoji nevaljan rejting u rezultatima." };

  const rows: ResultRow[] = tournament.results.map((r) => ({
    playerId: r.playerId,
    rank: r.rank,
    rating: r.ratingSnapshotUsed,
    gamesPlayed: r.gamesPlayed,
  }));

  // Jedini službeni obračun prije zaključavanja: isti scoring engine kao kod
  // običnog spremanja. Ako engine odbije rezultat, turnir ostaje otključan.
  const calculated = await saveTournamentResults(tournamentId, rows);
  if (calculated.error) return { error: `Zaključavanje prekinuto: ${calculated.error}` };

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.tournament.findUnique({ where: { id: tournamentId }, select: { status: true } });
      if (!current) throw new Error("Turnir nije pronađen.");
      if (current.status === "ZAVRSEN") throw new Error("Turnir je već zaključan.");

      await tx.tournamentResult.updateMany({
        where: { tournamentId },
        data: { isLocked: true, lockedAt: new Date() },
      });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "ZAVRSEN", minPlayersMet: true },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nije moguće zaključati rezultate." };
  }

  revalidatePath(`/admin/tournaments/${tournamentId}/results`);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { message: `Turnir je zaključen i GP bodovi su obračunati za ${played.length} igrača. Nakon zaključavanja rezultati se više ne mogu uređivati.` };
}
