"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { revalidatePlayers } from "@/lib/revalidate";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RatingRow = {
  playerId: string;
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
};

export type SaveRatingsState = { message?: string; error?: string };

/**
 * Bulk mjesečni unos rejtinga (čl. 7 GP: "ažuriraju se svakog 1. u mjesecu").
 * Za svakog igrača s barem jednom unesenom vrijednošću:
 *   1. upisuje/prepisuje PlayerRatingCurrent (za brzi prikaz na profilu)
 *   2. dodaje NOV zapis u PlayerRatingSnapshot s današnjim datumom (povijest
 *      se nikad ne briše — potrebna za FR izračun po datumu turnira)
 */
export async function saveBulkRatings(rows: RatingRow[]): Promise<SaveRatingsState> {
  const actor = await requireAdmin();
  const relevant = rows.filter(
    (r) => r.standard != null || r.rapid != null || r.blitz != null
  );

  if (relevant.length === 0) {
    return { error: "Nema unesenih vrijednosti." };
  }

  /**
   * Obrazac šalje SVE retke, i one koje nitko nije dirao. Dok se pisalo
   * svima, svaki je igrač s rejtingom dobivao snimak s današnjim datumom, a
   * u auditu je stajalo „Ažurirani rejtinzi za 100 igrača" kad je promijenjen
   * jedan. Povijest je tako izgledala kao da se cijeli klub mijenjao svaki
   * put, a trag o pravoj izmjeni nije se mogao naći.
   *
   * Zato se najprije pročita što je u bazi i obrade se samo stvarne izmjene.
   * Snimak se ne gubi: izračun F_R uzima zadnji snimak do dana turnira, a to
   * je i dalje onaj od prošle izmjene, s istom vrijednošću.
   */
  const trenutni = await prisma.playerRatingCurrent.findMany({
    where: { playerId: { in: relevant.map((r) => r.playerId) } },
    select: { playerId: true, standard: true, rapid: true, blitz: true },
  });
  const trenutniPo = new Map(trenutni.map((t) => [t.playerId, t]));

  const izmijenjeni = relevant.filter((r) => {
    const t = trenutniPo.get(r.playerId);
    if (!t) return true;
    return (
      t.standard !== r.standard ||
      t.rapid !== r.rapid ||
      t.blitz !== r.blitz
    );
  });

  if (izmijenjeni.length === 0) {
    return { message: "Nema promjena — ništa nije zapisano." };
  }

  // Ponoć tekućeg dana — snapshoti su jedinstveni po (igrač, tempo, dan),
  // pa dva klika na "Spremi" ne stvaraju duplikat.
  const now = new Date();
  const snapshotDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const row of izmijenjeni) {
    const prije = trenutniPo.get(row.playerId);
    ops.push(
      prisma.playerRatingCurrent.upsert({
        where: { playerId: row.playerId },
        create: {
          playerId: row.playerId,
          standard: row.standard,
          rapid: row.rapid,
          blitz: row.blitz,
        },
        update: {
          standard: row.standard,
          rapid: row.rapid,
          blitz: row.blitz,
        },
      })
    );

    if (row.standard != null && row.standard !== prije?.standard) {
      ops.push(
        prisma.playerRatingSnapshot.upsert({
          where: {
            playerId_ratingType_snapshotDate: {
              playerId: row.playerId,
              ratingType: "STANDARD",
              snapshotDate,
            },
          },
          create: {
            playerId: row.playerId,
            ratingType: "STANDARD",
            ratingValue: row.standard,
            snapshotDate,
          },
          update: { ratingValue: row.standard },
        })
      );
    }
    if (row.rapid != null && row.rapid !== prije?.rapid) {
      ops.push(
        prisma.playerRatingSnapshot.upsert({
          where: {
            playerId_ratingType_snapshotDate: {
              playerId: row.playerId,
              ratingType: "RAPID",
              snapshotDate,
            },
          },
          create: {
            playerId: row.playerId,
            ratingType: "RAPID",
            ratingValue: row.rapid,
            snapshotDate,
          },
          update: { ratingValue: row.rapid },
        })
      );
    }
    if (row.blitz != null && row.blitz !== prije?.blitz) {
      ops.push(
        prisma.playerRatingSnapshot.upsert({
          where: {
            playerId_ratingType_snapshotDate: {
              playerId: row.playerId,
              ratingType: "BLITZ",
              snapshotDate,
            },
          },
          create: {
            playerId: row.playerId,
            ratingType: "BLITZ",
            ratingValue: row.blitz,
            snapshotDate,
          },
          update: { ratingValue: row.blitz },
        })
      );
    }
  }

  try {
    await prisma.$transaction(ops);

    await logAudit({
      actor,
      action: "UPDATE",
      entity: "PlayerRating",
      summary: `Ažurirani rejtinzi za ${izmijenjeni.length} igrača`,
      after: {
        snapshotDate,
        playerIds: izmijenjeni.map((r) => r.playerId),
      },
    });

    revalidatePath("/admin/ratings");
    revalidatePlayers();
    revalidatePath("/admin/players");
    return { message: `Ažurirano ${izmijenjeni.length} igrača.` };
  } catch {
    return { error: "Došlo je do greške pri spremanju rejtinga." };
  }
}
