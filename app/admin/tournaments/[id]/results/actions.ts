"use server";

import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculateAverageRating, calculateGpPoints, type TournamentLevel, type Tempo } from "@/lib/scoring/gp/formulas";
import { calculateFinalPoints, calculateQualifierPoints } from "@/lib/scoring/akademija/formulas";
import { buildAkademijaSnapshot, buildGpSnapshot, type ScoringSnapshot } from "@/lib/scoring/rulebook";
import { resolveAcademyEligibility } from "@/lib/akademija/eligibility";
import { wasClubMemberOn } from "@/lib/membership";

export type ResultRow = {
  playerId: string;
  rank: number;
  rating: number | null;
  gamesPlayed: boolean;
};

export type SaveResultsState = { message?: string; error?: string };

export async function saveTournamentResults(tournamentId: string, rows: ResultRow[]): Promise<SaveResultsState> {
  await requireAdmin();
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: { season: true } });
  if (!tournament) return { error: "Turnir nije pronađen." };

  if (tournament.status === "ZAVRSEN") return { error: "Turnir je zaključan. Rezultati se više ne mogu mijenjati." };
  const existingLocked = await prisma.tournamentResult.findFirst({ where: { tournamentId, isLocked: true }, select: { id: true } });
  if (existingLocked) return { error: "Rezultati su zaključani. Rezultati se više ne mogu mijenjati." };

  const playedRows = rows.filter((r) => r.gamesPlayed);
  const N = playedRows.length;
  if (N === 0) return { error: "Nema unesenih igrača koji su odigrali partiju." };

  try {
    const pointsByPlayer = new Map<string, { points: number | null; ratingUsed: number | null; snapshot: ScoringSnapshot }>();
    const ineligiblePlayers: string[] = [];
    const recomputedPlayers: string[] = [];
    const ruleVersion = tournament.season.rulebookVersion;

    const membershipPlayers = await prisma.player.findMany({
      where: { id: { in: playedRows.map((r) => r.playerId) } },
      select: { id: true, isClubMember: true, memberSince: true, memberUntil: true },
    });
    const membershipById = new Map(membershipPlayers.map((p) => [p.id, p]));
    const memberOnDate = (playerId: string): boolean => {
      const p = membershipById.get(playerId);
      return p ? wasClubMemberOn(p, tournament.date) : false;
    };

    if (tournament.season.system === "GP") {
      if (!tournament.level) return { error: "Turnir pripada Dubrovnik GP sustavu i mora imati postavljenu razinu (KLUPSKA/NATJECATELJSKA/VRHUNSKA) prije unosa rezultata." };
      if (N < 6) return { error: "Turnir s manje od 6 igrača ne ulazi u GP (čl. 6) — bodovi se ne mogu izračunati." };
      const averageRating = calculateAverageRating(playedRows.map((r) => r.rating));
      for (const row of playedRows) {
        const points = calculateGpPoints({ playerCount: N, rank: row.rank, level: tournament.level as TournamentLevel, tempo: tournament.tempo as Tempo, averageRating });
        const snapshot = buildGpSnapshot({ playerCount: N, rank: row.rank, level: tournament.level as TournamentLevel, tempo: tournament.tempo as Tempo, averageRating, points, ruleVersion });
        pointsByPlayer.set(row.playerId, { points, ratingUsed: row.rating, snapshot });
      }
    } else {
      if (N < 7) return { error: "Turnir s manje od 7 igrača ne ulazi u GP Akademije (čl. 6) — bodovi se ne mogu izračunati." };
      const players = await prisma.player.findMany({ where: { id: { in: playedRows.map((r) => r.playerId) } }, select: { id: true, birthDate: true, lastName: true, firstName: true } });
      const playerById = new Map(players.map((p) => [p.id, p]));
      for (const row of playedRows) {
        const player = playerById.get(row.playerId);
        const label = player ? `${player.lastName} ${player.firstName}` : `nepoznat igrač (${row.playerId})`;
        const { isEligible, status } = await resolveAcademyEligibility({
          seasonId: tournament.seasonId,
          seasonStartDate: tournament.season.startDate,
          tournamentId: tournament.id,
          tournamentDate: tournament.date,
          playerId: row.playerId,
          birthDate: player?.birthDate ?? null,
          rapidRatingAtThisTournament: row.rating,
        });
        if (status === "recomputed") recomputedPlayers.push(label);
        if (!isEligible) {
          ineligiblePlayers.push(label);
          pointsByPlayer.set(row.playerId, { points: null, ratingUsed: row.rating, snapshot: buildAkademijaSnapshot({ playerCount: N, rank: row.rank, isFinal: tournament.isFinal, eligible: false, points: null, ruleVersion }) });
          continue;
        }
        const points = tournament.isFinal ? calculateFinalPoints({ playerCount: N, rank: row.rank }) : calculateQualifierPoints({ playerCount: N, rank: row.rank });
        pointsByPlayer.set(row.playerId, { points, ratingUsed: row.rating, snapshot: buildAkademijaSnapshot({ playerCount: N, rank: row.rank, isFinal: tournament.isFinal, eligible: true, points, ruleVersion }) });
      }
    }

    await prisma.$transaction(playedRows.map((row) => {
      const calc = pointsByPlayer.get(row.playerId)!;
      return prisma.tournamentResult.upsert({
        where: { tournamentId_playerId: { tournamentId, playerId: row.playerId } },
        create: { tournamentId, playerId: row.playerId, rank: row.rank, gamesPlayed: true, wasClubMember: memberOnDate(row.playerId), ratingSnapshotUsed: calc.ratingUsed, ratingOverridden: true, gpPoints: calc.points, scoringSnapshot: calc.snapshot as object },
        update: { rank: row.rank, gamesPlayed: true, wasClubMember: memberOnDate(row.playerId), ratingSnapshotUsed: calc.ratingUsed, gpPoints: calc.points, scoringSnapshot: calc.snapshot as object },
      });
    }));

    revalidatePath(`/admin/tournaments/${tournamentId}/results`);
    const eligibleCount = N - ineligiblePlayers.length;
    let message = `Spremljeno — bodovi izračunati za ${eligibleCount} igrača.`;
    if (ineligiblePlayers.length > 0) message += ` Bez prava na bodove (čl. 3 — dob/rejting ili nepostavljen točan datum rođenja): ${ineligiblePlayers.join(", ")}.`;
    if (recomputedPlayers.length > 0) message += ` UPOZORENJE: ovaj turnir je raniji od dosad zabilježenog prvog nastupa za: ${recomputedPlayers.join(", ")}. Pravo na bodove preračunato je prema njemu — provjerite rezultate tih igrača na kasnijim turnirima sezone.`;
    return { message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Došlo je do neočekivane greške pri izračunu bodova." };
  }
}
