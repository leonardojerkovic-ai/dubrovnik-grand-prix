"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashLinkCode, looksLikeLinkCode } from "@/lib/link-code";
import { claimPlayerByLinkCode } from "@/lib/claim-link-code";
import { needsGuardian, SELF_ACCOUNT_AGE } from "@/lib/guardian-rules";

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

  if (!needsGuardian(player.birthYear)) {
    return {
      error:
        `Igrači od ${SELF_ACCOUNT_AGE} godina naviše vode vlastiti račun. ` +
        "Proslijedi mu kod da ga upiše pri registraciji.",
    };
  }

  const claimed = await prisma.$transaction(async (tx) => {
    if (!(await claimPlayerByLinkCode(tx, player.id))) return false;
    await tx.guardianLink.create({
      data: { guardianUserId: user.id, playerId: player.id },
    });
    return true;
  });

  // Netko je istim kodom stigao prije. Ista poruka kao i za nevaljan kod.
  if (!claimed) {
    return { error: "Kod nije valjan ili je već iskorišten." };
  }

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

  // Poruka mora odgovarati onome što se dogodilo: dosad je stajalo
  // „Uklonjeno" i kad veze nije bilo (pogrešan playerId, dvostruki klik,
  // tuđe dijete), pa je roditelj mislio da je nešto učinio.
  const { count } = await prisma.guardianLink.deleteMany({
    where: { guardianUserId: user.id, playerId },
  });

  if (count === 0) {
    return { error: "Taj igrač nije na tvojem popisu." };
  }

  revalidatePath("/moji-igraci");
  return { message: "Uklonjeno s popisa." };
}
