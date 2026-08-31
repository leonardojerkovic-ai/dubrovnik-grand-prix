"use server";

import { revalidatePath } from "next/cache";
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
  const parsed = seasonSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { system, yearLabel, startDate, endDate, isActive } = parsed.data;

  try {
    const season = await prisma.season.create({
      data: {
        system,
        yearLabel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    if (isActive) {
      await deactivateOtherSeasons(system, season.id);
    }
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
  redirect("/admin/seasons");
}

export async function updateSeason(
  seasonId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = seasonSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { system, yearLabel, startDate, endDate, isActive } = parsed.data;

  try {
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        system,
        yearLabel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    if (isActive) {
      await deactivateOtherSeasons(system, seasonId);
    }
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
  return { message: "Spremljeno." };
}

export async function deleteSeason(seasonId: string): Promise<void> {
  await prisma.season.delete({ where: { id: seasonId } });
  revalidatePath("/admin/seasons");
}
