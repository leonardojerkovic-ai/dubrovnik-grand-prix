"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canActFor, getManagedPlayers } from "@/lib/guardian";
import { checkEligibility } from "@/lib/scoring/eligibility";

/** Gumb za prijavu stoji na više stranica, pa se sve moraju osvježiti. */
function revalidateRegistrations(tournamentId: string) {
  revalidatePath("/prijave");
  revalidatePath("/kalendar");
  revalidatePath("/");
  revalidatePath(`/turniri/${tournamentId}`);
}

export type RegisterActionState = { error?: string; message?: string };

/**
 * Utvrđuje za kojeg se igrača radnja izvodi.
 *
 * Roditelj može upravljati s više djece, pa se igrač bira izričito. Kad
 * korisnik upravlja samo jednim profilom, izbor nije potreban i uzima se on.
 */
async function resolvePlayer(
  playerId?: string
): Promise<{ id: string } | { error: string }> {
  const managed = await getManagedPlayers();

  if (managed.length === 0) {
    return {
      error:
        "Tvoj račun još nije povezan ni s jednim igračkim profilom. Upiši pristupni kod u „Moji igrači“.",
    };
  }

  if (!playerId) {
    if (managed.length === 1) return { id: managed[0]!.id };
    return { error: "Odaberi za kojeg se igrača prijavljuješ." };
  }

  if (!(await canActFor(playerId))) {
    return { error: "Nemaš ovlasti djelovati u ime tog igrača." };
  }
  return { id: playerId };
}

export async function registerForTournament(
  tournamentId: string,
  playerId?: string
): Promise<RegisterActionState> {
  const resolved = await resolvePlayer(playerId);
  if ("error" in resolved) return { error: resolved.error };
  const player = resolved;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { season: { select: { system: true, startDate: true } } },
  });
  if (!tournament) return { error: "Turnir nije pronađen." };
  if (tournament.status !== "PRIJAVE_OTVORENE") {
    return { error: "Prijave za ovaj turnir trenutno nisu otvorene." };
  }

  // Pravo nastupa (čl. 14 GP / čl. 6 Akademije). Rejting se gleda NA DAN
  // PRIJAVE: mijenja se prvog u mjesecu, a tiho propala prijava bila bi
  // gora od igrača koji je granicu prešao između prijave i turnira.
  const full = await prisma.player.findUnique({
    where: { id: player.id },
    select: {
      birthYear: true,
      gender: true,
      ratingsCurrent: { select: { standard: true, rapid: true, blitz: true } },
    },
  });
  if (!full) return { error: "Igrač nije pronađen." };

  const tempoRating =
    tournament.tempo === "STANDARD"
      ? full.ratingsCurrent?.standard
      : tournament.tempo === "BLITZ"
        ? full.ratingsCurrent?.blitz
        : full.ratingsCurrent?.rapid;

  const eligibility = checkEligibility(
    {
      birthYear: full.birthYear,
      gender: full.gender,
      tempoRating: tempoRating ?? null,
      rapidRating: full.ratingsCurrent?.rapid ?? null,
    },
    {
      restrictedCategories: tournament.restrictedCategories,
      seasonSystem: tournament.season.system as "GP" | "AKADEMIJA",
      seasonStartYear: tournament.season.startDate.getFullYear(),
      academyPointsOnly: tournament.academyPointsOnly,
    }
  );

  if (!eligibility.allowed) {
    return { error: eligibility.reason };
  }

  await prisma.tournamentRegistration.upsert({
    where: {
      tournamentId_playerId: { tournamentId, playerId: player.id },
    },
    create: { tournamentId, playerId: player.id, status: "PRIJAVLJEN" },
    update: { status: "PRIJAVLJEN" },
  });

  revalidateRegistrations(tournamentId);
  return { message: "Prijavljen/a si na turnir." };
}

export async function cancelRegistration(
  tournamentId: string,
  playerId?: string
): Promise<RegisterActionState> {
  const resolved = await resolvePlayer(playerId);
  if ("error" in resolved) return { error: resolved.error };
  const player = resolved;

  await prisma.tournamentRegistration.updateMany({
    where: { tournamentId, playerId: player.id },
    data: { status: "OTKAZAN" },
  });

  revalidateRegistrations(tournamentId);
  return { message: "Prijava otkazana." };
}
