"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { needsGuardian, SELF_ACCOUNT_AGE } from "@/lib/guardian-rules";

export type GuardianAdminState = { error?: string; message?: string };

/**
 * Uspostavlja skrbništvo bez pristupnog koda.
 *
 * Postoji zato što roditelji koji i sami igraju već imaju račun i vlastiti
 * profil, pa im je za svako dijete trebalo izdati kod i čekati da ga upišu.
 * Administrator koji te ljude poznaje može to riješiti izravno.
 */
export async function addGuardianship(
  _prev: GuardianAdminState,
  formData: FormData
): Promise<GuardianAdminState> {
  const actor = await requireAdmin();

  const guardianUserId = String(formData.get("guardianUserId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");

  if (!guardianUserId || !playerId) {
    return { error: "Odaberi i račun i igrača." };
  }

  const [user, player] = await Promise.all([
    prisma.user.findUnique({
      where: { id: guardianUserId },
      select: { email: true, player: { select: { id: true } } },
    }),
    prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true, birthYear: true },
    }),
  ]);

  if (!user || !player) return { error: "Račun ili igrač nije pronađen." };

  if (!needsGuardian(player.birthYear)) {
    return {
      error:
        `${player.lastName} ${player.firstName} ima ${SELF_ACCOUNT_AGE} godina ili više i vodi vlastiti račun. ` +
        "Skrbništvo se uspostavlja samo za mlađe igrače.",
    };
  }

  // Račun ne može biti skrbnik samom sebi.
  if (user.player?.id === player.id) {
    return { error: "Taj račun već ima taj profil kao vlastiti." };
  }

  try {
    await prisma.guardianLink.create({
      data: { guardianUserId, playerId },
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { error: "To skrbništvo već postoji." };
    }
    throw err;
  }

  await logAudit({
    actor,
    action: "CREATE",
    entity: "GuardianLink",
    entityId: `${guardianUserId}:${playerId}`,
    summary: `Skrbništvo: ${user.email} vodi ${player.lastName} ${player.firstName}`,
    after: { guardianUserId, playerId },
  });

  revalidatePath("/admin/skrbnistva");
  return {
    message: `${user.email} sada vodi profil ${player.lastName} ${player.firstName}.`,
  };
}

/** Uklanja skrbništvo. */
export async function removeGuardianship(linkId: string): Promise<void> {
  const actor = await requireAdmin();

  const link = await prisma.guardianLink.findUnique({
    where: { id: linkId },
    select: {
      guardian: { select: { email: true } },
      player: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.guardianLink.delete({ where: { id: linkId } });

  await logAudit({
    actor,
    action: "DELETE",
    entity: "GuardianLink",
    entityId: linkId,
    summary: `Uklonjeno skrbništvo: ${link?.guardian.email ?? "?"} nad ${
      link ? `${link.player.lastName} ${link.player.firstName}` : "?"
    }`,
    before: link,
  });

  revalidatePath("/admin/skrbnistva");
}
