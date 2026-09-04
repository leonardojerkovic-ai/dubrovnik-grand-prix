"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { checkEligibility } from "@/lib/scoring/eligibility";

/** Vraća razlog zbog kojeg igrač nema pravo nastupa, ili null. */
async function eligibilityWarning(
  tournamentId: string,
  playerId: string
): Promise<string | null> {
  const [tournament, player] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { season: { select: { system: true, startDate: true } } },
    }),
    prisma.player.findUnique({
      where: { id: playerId },
      select: {
        birthYear: true,
        gender: true,
        ratingsCurrent: { select: { standard: true, rapid: true, blitz: true } },
      },
    }),
  ]);
  if (!tournament || !player) return null;

  const tempoRating =
    tournament.tempo === "STANDARD"
      ? player.ratingsCurrent?.standard
      : tournament.tempo === "BLITZ"
        ? player.ratingsCurrent?.blitz
        : player.ratingsCurrent?.rapid;

  const result = checkEligibility(
    {
      birthYear: player.birthYear,
      gender: player.gender,
      tempoRating: tempoRating ?? null,
      rapidRating: player.ratingsCurrent?.rapid ?? null,
    },
    {
      restrictedCategories: tournament.restrictedCategories,
      seasonSystem: tournament.season.system as "GP" | "AKADEMIJA",
      seasonStartYear: tournament.season.startDate.getFullYear(),
      academyPointsOnly: tournament.academyPointsOnly,
    }
  );

  return result.allowed ? null : result.reason;
}

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type AdminRegistrationState = { error?: string; message?: string };

/**
 * Admin ručno dodaje igrača na popis prijavljenih za turnir — neovisno o
 * tome je li se igrač sam prijavio online ili ima li već uneseni rezultat.
 * Korisno za dodavanje igrača bez korisničkog računa, ili za popunjavanje
 * popisa prije nego se turnir uopće odigra.
 */
export async function adminAddRegistration(
  tournamentId: string,
  playerId: string
): Promise<AdminRegistrationState> {
  const actor = await requireAdmin();
  if (!playerId) {
    return { error: "Odaberi igrača." };
  }

  await prisma.tournamentRegistration.upsert({
    where: { tournamentId_playerId: { tournamentId, playerId } },
    create: { tournamentId, playerId, status: "PRIJAVLJEN" },
    update: { status: "PRIJAVLJEN" },
  });

  await logAudit({
    actor,
    action: "CREATE",
    entity: "TournamentRegistration",
    entityId: `${tournamentId}:${playerId}`,
    summary: "Igrač ručno dodan na popis prijavljenih",
    after: { tournamentId, playerId, status: "PRIJAVLJEN" },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/prijave`);

  // Admin smije dodati i igrača bez prava nastupa — postoje razlozi koje
  // sustav ne zna. Ali ga se upozorava, da to ne prođe nezapaženo.
  const warning = await eligibilityWarning(tournamentId, playerId);
  return {
    message: warning
      ? `Igrač dodan na popis prijavljenih. UPOZORENJE: ${warning}`
      : "Igrač dodan na popis prijavljenih.",
  };
}

export async function adminRemoveRegistration(
  registrationId: string,
  tournamentId: string
): Promise<void> {
  const actor = await requireAdmin();
  const updated = await prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data: { status: "OTKAZAN" },
    include: { player: { select: { firstName: true, lastName: true } } },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "TournamentRegistration",
    entityId: registrationId,
    summary: `Otkazana prijava: ${updated.player.lastName} ${updated.player.firstName}`,
    after: { status: "OTKAZAN" },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/prijave`);
}
