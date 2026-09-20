"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { syncTournamentMedals } from "@/lib/akademija/medals";
import type { MedalCategory } from "@prisma/client";

/**
 * Ručno dodjeljuje medalju određenom igraču.
 *
 * Zapis se označava s manual = true, pa ga ponovni izračun ne dira. Time
 * iznimka preživi svaku kasniju izmjenu rezultata — inače bi tiho nestala
 * pri prvom sljedećem spremanju.
 *
 * Igraču se prije toga uklanja eventualna druga medalja na istom turniru:
 * čl. 19 st. 4 dopušta najviše jednu, a i jedinstveni indeks u bazi to
 * traži. Bez toga bi upis pao s nerazumljivom greškom.
 */
export async function setMedalManually(
  tournamentId: string,
  category: MedalCategory,
  place: number,
  playerId: string,
  note: string
): Promise<void> {
  const actor = await requireAdmin();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { seasonId: true, name: true },
  });
  if (!tournament) return;

  await prisma.$transaction([
    prisma.medal.deleteMany({ where: { tournamentId, playerId } }),
    prisma.medal.deleteMany({ where: { tournamentId, category, place } }),
    prisma.medal.create({
      data: {
        seasonId: tournament.seasonId,
        tournamentId,
        playerId,
        category,
        place,
        manual: true,
        note: note.trim() === "" ? null : note.trim(),
      },
    }),
  ]);

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Medal",
    entityId: tournamentId,
    summary: `Ručno dodijeljena medalja ${category} (${place}.) na turniru "${tournament.name}"`,
    after: { category, place, playerId, note },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/medalje`);
  revalidatePath(`/turniri/${tournamentId}`);
}

/**
 * Briše ručnu dodjelu i vraća mjesto automatskom izračunu.
 */
export async function clearManualMedal(
  tournamentId: string,
  category: MedalCategory,
  place: number
): Promise<void> {
  const actor = await requireAdmin();

  await prisma.medal.deleteMany({
    where: { tournamentId, category, place, manual: true },
  });

  await syncTournamentMedals(tournamentId);

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Medal",
    entityId: tournamentId,
    summary: `Poništena ručna dodjela ${category} (${place}.)`,
    after: { category, place },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/medalje`);
  revalidatePath(`/turniri/${tournamentId}`);
}

export async function recomputeMedals(tournamentId: string): Promise<void> {
  const actor = await requireAdmin();
  const result = await syncTournamentMedals(tournamentId);

  await logAudit({
    actor,
    action: "RECALCULATE",
    entity: "Medal",
    entityId: tournamentId,
    summary: `Preračunate medalje (${result.awarded} dodijeljeno)`,
    after: result,
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/medalje`);
  revalidatePath(`/turniri/${tournamentId}`);
}
