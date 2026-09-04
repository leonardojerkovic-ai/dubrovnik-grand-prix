"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { revalidateSchedule, revalidateStandings } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seasonSchema } from "@/lib/validation/season";
import type { ActionState } from "../players/actions";

function parseFormData(formData: FormData) {
  return {
    system: formData.get("system"),
    yearLabel: formData.get("yearLabel"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isActive: formData.get("isActive") === "on",
    rulebookVersion: formData.get("rulebookVersion"),
  };
}

/**
 * Samo jedna sezona po sustavu (GP / AKADEMIJA) smije biti isActive=true u
 * isto vrijeme (koristi se npr. za "trenutna sezona" na naslovnici).
 * Nije eksplicitno propisano pravilnikom, ali sprječava zabunu u UI-u.
 */
async function deactivateOtherSeasons(system: "GP" | "AKADEMIJA", exceptId?: string) {
  await prisma.season.updateMany({
    where: { system, id: exceptId ? { not: exceptId } : undefined },
    data: { isActive: false },
  });
}

export async function createSeason(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = seasonSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { system, yearLabel, startDate, endDate, isActive, rulebookVersion } =
    parsed.data;
  const rulebook =
    rulebookVersion && rulebookVersion.length > 0 ? rulebookVersion : null;

  try {
    const season = await prisma.season.create({
      data: {
        system,
        yearLabel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        rulebookVersion: rulebook,
      },
    });

    if (isActive) {
      await deactivateOtherSeasons(system, season.id);
    }

    await logAudit({
      actor,
      action: "CREATE",
      entity: "Season",
      entityId: season.id,
      summary: `Stvorena sezona ${season.yearLabel} (${season.system})`,
      after: season,
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        errors: {
          yearLabel: ["Sezona s ovom oznakom već postoji za ovaj sustav."],
        },
      };
    }
    return { message: "Došlo je do greške pri spremanju sezone." };
  }

  revalidatePath("/admin/seasons");
  revalidateSchedule();
  revalidateStandings();
  redirect("/admin/seasons");
}

export async function updateSeason(
  seasonId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = seasonSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { system, yearLabel, startDate, endDate, isActive, rulebookVersion } =
    parsed.data;
  const rulebook =
    rulebookVersion && rulebookVersion.length > 0 ? rulebookVersion : null;
  const before = await prisma.season.findUnique({ where: { id: seasonId } });

  try {
    const updated = await prisma.season.update({
      where: { id: seasonId },
      data: {
        system,
        yearLabel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        rulebookVersion: rulebook,
      },
    });

    if (isActive) {
      await deactivateOtherSeasons(system, seasonId);
    }

    await logAudit({
      actor,
      action: "UPDATE",
      entity: "Season",
      entityId: seasonId,
      summary: `Izmijenjena sezona ${updated.yearLabel} (${updated.system})`,
      before,
      after: updated,
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        errors: {
          yearLabel: ["Sezona s ovom oznakom već postoji za ovaj sustav."],
        },
      };
    }
    return { message: "Došlo je do greške pri spremanju sezone." };
  }

  revalidatePath("/admin/seasons");
  revalidatePath(`/admin/seasons/${seasonId}`);
  // Oznaka aktivne sezone određuje što se prikazuje na naslovnici.
  revalidateSchedule();
  revalidateStandings();
  return { message: "Spremljeno." };
}

export async function deleteSeason(seasonId: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.season.findUnique({ where: { id: seasonId } });
  try {
    await prisma.season.delete({ where: { id: seasonId } });
    await logAudit({
      actor,
      action: "DELETE",
      entity: "Season",
      entityId: seasonId,
      summary: `Obrisana sezona ${before?.yearLabel ?? seasonId}`,
      before,
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2003"
    ) {
      throw new Error(
        "Ova sezona ima turnire — prvo obriši sve turnire te sezone, pa onda sezonu."
      );
    }
    throw err;
  }
  revalidatePath("/admin/seasons");
  revalidateSchedule();
  revalidateStandings();
}
