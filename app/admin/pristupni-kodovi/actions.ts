"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { generateLinkCode, hashLinkCode } from "@/lib/link-code";
import { sendLinkCodeEmail } from "@/lib/email";

export type CodeResult = {
  error?: string;
  /** Kod se vraća JEDNOM, radi prikaza — u bazi je samo otisak. */
  code?: string;
  playerName?: string;
};

/**
 * Izdaje nov pristupni kod za igrača.
 *
 * Postojeći kod time prestaje vrijediti. Kod se vraća pozivatelju da ga
 * admin može prekopirati; u bazi ostaje samo otisak, pa ga se poslije ne
 * može ponovno pročitati — samo izdati novi.
 */
export async function issueLinkCode(playerId: string): Promise<CodeResult> {
  const actor = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, firstName: true, lastName: true, userId: true },
  });

  if (!player) return { error: "Igrač nije pronađen." };
  if (player.userId) {
    return { error: "Taj igrač već ima povezan korisnički račun." };
  }

  const code = generateLinkCode();

  await prisma.player.update({
    where: { id: playerId },
    data: {
      linkCodeHash: hashLinkCode(code),
      linkCodeIssuedAt: new Date(),
      linkCodeUsedAt: null,
    },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Player",
    entityId: playerId,
    summary: `Izdan pristupni kod za ${player.lastName} ${player.firstName}`,
    // Sam kod se NAMJERNO ne zapisuje u trag — trag bi inače postao popis
    // valjanih kodova.
  });

  revalidatePath("/admin/pristupni-kodovi");
  return { code, playerName: `${player.firstName} ${player.lastName}` };
}

/** Izdaje kod i odmah ga šalje na zadanu adresu e-pošte. */
export async function issueAndEmailLinkCode(
  playerId: string,
  email: string
): Promise<CodeResult> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { error: "Adresa e-pošte nije ispravna." };
  }

  const result = await issueLinkCode(playerId);
  if (result.error || !result.code) return result;

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  try {
    await sendLinkCodeEmail(
      trimmed,
      result.playerName ?? "",
      result.code,
      `${baseUrl}/registracija`
    );
  } catch {
    return {
      ...result,
      error:
        "Kod je izdan, ali slanje e-pošte nije uspjelo. Pošalji ga ručno tekstom ispod.",
    };
  }

  return result;
}

/** Poništava izdani kod bez izdavanja novog. */
export async function revokeLinkCode(playerId: string): Promise<CodeResult> {
  const actor = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { firstName: true, lastName: true },
  });
  if (!player) return { error: "Igrač nije pronađen." };

  await prisma.player.update({
    where: { id: playerId },
    data: { linkCodeHash: null, linkCodeIssuedAt: null, linkCodeUsedAt: null },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Player",
    entityId: playerId,
    summary: `Poništen pristupni kod za ${player.lastName} ${player.firstName}`,
  });

  revalidatePath("/admin/pristupni-kodovi");
  return {};
}
