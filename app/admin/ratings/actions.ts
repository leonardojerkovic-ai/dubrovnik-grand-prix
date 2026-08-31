"use server";

import { revalidatePath } from "next/cache";
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
  const relevant = rows.filter(
    (r) => r.standard != null || r.rapid != null || r.blitz != null
  );

  if (relevant.length === 0) {
    return { error: "Nema unesenih vrijednosti." };
  }

  const snapshotDate = new Date();
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const row of relevant) {
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

    if (row.standard != null) {
      ops.push(
        prisma.playerRatingSnapshot.create({
          data: {
            playerId: row.playerId,
            ratingType: "STANDARD",
            ratingValue: row.standard,
            snapshotDate,
          },
        })
      );
    }
    if (row.rapid != null) {
      ops.push(
        prisma.playerRatingSnapshot.create({
          data: {
            playerId: row.playerId,
            ratingType: "RAPID",
            ratingValue: row.rapid,
            snapshotDate,
          },
        })
      );
    }
    if (row.blitz != null) {
      ops.push(
        prisma.playerRatingSnapshot.create({
          data: {
            playerId: row.playerId,
            ratingType: "BLITZ",
            ratingValue: row.blitz,
            snapshotDate,
          },
        })
      );
    }
  }

  try {
    await prisma.$transaction(ops);
    revalidatePath("/admin/ratings");
    revalidatePath("/admin/players");
    return { message: `Ažurirano ${relevant.length} igrača.` };
  } catch {
    return { error: "Došlo je do greške pri spremanju rejtinga." };
  }
}
