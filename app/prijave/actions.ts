"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPlayer } from "@/lib/current-player";

export type RegisterActionState = { error?: string; message?: string };

export async function registerForTournament(
  tournamentId: string
): Promise<RegisterActionState> {
  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "Moraš biti prijavljen da bi se prijavio/la na turnir." };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return { error: "Turnir nije pronađen." };
  if (tournament.status !== "PRIJAVE_OTVORENE") {
    return { error: "Prijave za ovaj turnir trenutno nisu otvorene." };
  }

  await prisma.tournamentRegistration.upsert({
    where: {
      tournamentId_playerId: { tournamentId, playerId: player.id },
    },
    create: { tournamentId, playerId: player.id, status: "PRIJAVLJEN" },
    update: { status: "PRIJAVLJEN" },
  });

  revalidatePath("/prijave");
  return { message: "Prijavljen/a si na turnir." };
}

export async function cancelRegistration(
  tournamentId: string
): Promise<RegisterActionState> {
  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "Moraš biti prijavljen." };
  }

  await prisma.tournamentRegistration.updateMany({
    where: { tournamentId, playerId: player.id },
    data: { status: "OTKAZAN" },
  });

  revalidatePath("/prijave");
  return { message: "Prijava otkazana." };
}
