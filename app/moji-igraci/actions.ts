"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashLinkCode, looksLikeLinkCode } from "@/lib/link-code";
import { isMinorByBirthYear } from "@/lib/guardian-rules";

export type GuardianActionState = { error?: string; message?: string };

/**
 * Dodaje dijete pod skrbništvo upisom njegova pristupnog koda.
 *
 * Dopušteno samo za maloljetne igrače: punoljetni igrač vodi svoj račun sam,
 * pa bi tuđi pristup njegovim podacima bio neprimjeren.
 */
export async function addChildByCode(
  _prev: GuardianActionState,
  formData: FormData
): Promise<GuardianActionState> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { error: "Moraš biti prijavljen/a." };

  const raw = String(formData.get("linkCode") ?? "").trim();
  if (!looksLikeLinkCode(raw)) {
    return { error: "Kod nije ispravnog oblika." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: "Korisnik nije pronađen." };

  const player = await prisma.player.findUnique({
    where: { linkCodeHash: hashLinkCode(raw) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      userId: true,
      linkCodeUsedAt: true,
    },
  });

  // Ista poruka za nepostojeći, iskorišten i zauzet kod — inače bi se
  // pogađanjem moglo doznati koji kodovi postoje.
  if (!player || player.userId || player.linkCodeUsedAt) {
    return { error: "Kod nije valjan ili je već iskorišten." };
  }

  if (!isMinorByBirthYear(player.birthYear)) {
    return {
      error:
        "Taj igrač je punoljetan i mora otvoriti vlastiti račun. Proslijedi mu kod da ga upiše pri registraciji.",
    };
  }

  await prisma.$transaction([
    prisma.guardianLink.create({
      data: { guardianUserId: user.id, playerId: player.id },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: { linkCodeUsedAt: new Date() },
    }),
  ]);

  revalidatePath("/moji-igraci");
  return {
    message: `${player.firstName} ${player.lastName} je dodan/a na tvoj popis.`,
  };
}

/** Uklanja skrbništvo nad igračem. */
export async function removeChild(playerId: string): Promise<GuardianActionState> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { error: "Moraš biti prijavljen/a." };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: "Korisnik nije pronađen." };

  await prisma.guardianLink.deleteMany({
    where: { guardianUserId: user.id, playerId },
  });

  revalidatePath("/moji-igraci");
  return { message: "Uklonjeno s popisa." };
}
