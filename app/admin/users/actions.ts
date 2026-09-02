"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateUserRole(userId: string, role: "PLAYER" | "ADMIN" | "GP_MANAGER") {
  // Samo ADMIN smije mijenjati role — GP_MANAGER ima pristup admin panelu
  // za svoj posao (turniri, rezultati) ali ne smije dijeliti admin prava.
  const actor = await requireAdmin(["ADMIN"]);

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  await prisma.user.update({ where: { id: userId }, data: { role } });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "User",
    entityId: userId,
    summary: `Uloga korisnika ${before?.email ?? userId}: ${before?.role ?? "?"} -> ${role}`,
    before,
    after: { email: before?.email, role },
  });

  revalidatePath("/admin/users");
}

/**
 * Povezuje korisnički račun s igračkim profilom — ručna potvrda zahtjeva
 * nastalog pri samostalnoj registraciji.
 *
 * Provjerava da profil već nema drugog vlasnika, jer je 1:1 veza i tiho
 * preuzimanje tuđeg profila je upravo ono što ovaj postupak sprječava.
 */
export async function linkUserToPlayer(userId: string, playerId: string) {
  const actor = await requireAdmin();

  const [user, player] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true, userId: true },
    }),
  ]);

  if (!user || !player) {
    throw new Error("Korisnik ili igrač nije pronađen.");
  }
  if (player.userId && player.userId !== userId) {
    throw new Error(
      "Taj igrački profil već je povezan s drugim računom. Prvo razriješi tu vezu."
    );
  }

  await prisma.$transaction([
    prisma.player.update({ where: { id: playerId }, data: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { needsPlayerLink: false, pendingPlayerId: null },
    }),
  ]);

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "User",
    entityId: userId,
    summary: `Račun ${user.email} povezan s igračem ${player.lastName} ${player.firstName}`,
    after: { userId, playerId },
  });

  revalidatePath("/admin/users");
}

/** Odbija zahtjev za povezivanje — račun ostaje bez igračkog profila. */
export async function dismissPlayerLink(userId: string) {
  const actor = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, claimedName: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { needsPlayerLink: false, pendingPlayerId: null },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "User",
    entityId: userId,
    summary: `Odbijen zahtjev za povezivanje: ${user?.email ?? userId} (tvrdio da je ${user?.claimedName ?? "?"})`,
  });

  revalidatePath("/admin/users");
}
