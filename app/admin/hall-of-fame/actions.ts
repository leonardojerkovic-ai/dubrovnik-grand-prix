"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hallOfFameSchema } from "@/lib/validation/hall-of-fame";
import type { ActionState } from "../players/actions";

export async function createHallOfFameEntry(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = hallOfFameSchema.safeParse({
    seasonId: formData.get("seasonId"),
    categoryCode: formData.get("categoryCode"),
    playerId: formData.get("playerId"),
    place: formData.get("place"),
    pointsTotal: formData.get("pointsTotal"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await prisma.hallOfFame.create({ data: parsed.data });
    await logAudit({
      actor,
      action: "CREATE",
      entity: "HallOfFame",
      entityId: created.id,
      summary: `Hall of Fame: dodano ${created.place}. mjesto (${created.categoryCode})`,
      after: created,
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        message:
          "Za ovu sezonu/kategoriju/mjesto već postoji unos — obriši postojeći prije dodavanja novog.",
      };
    }
    return { message: "Došlo je do greške pri spremanju." };
  }

  revalidatePath("/admin/hall-of-fame");
  revalidatePath("/hall-of-fame");
  redirect("/admin/hall-of-fame");
}

export async function deleteHallOfFameEntry(id: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.hallOfFame.findUnique({ where: { id } });
  await prisma.hallOfFame.delete({ where: { id } });
  await logAudit({
    actor,
    action: "DELETE",
    entity: "HallOfFame",
    entityId: id,
    summary: `Hall of Fame: obrisano ${before?.place ?? "?"}. mjesto (${before?.categoryCode ?? "?"})`,
    before,
  });
  revalidatePath("/admin/hall-of-fame");
  revalidatePath("/hall-of-fame");
}
