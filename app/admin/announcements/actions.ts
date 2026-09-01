"use server";

import { requireAdmin } from "@/lib/require-admin";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validation/announcement";
import type { ActionState } from "../players/actions";

export async function createAnnouncement(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    tournamentId: formData.get("tournamentId"),
    seasonId: formData.get("seasonId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { tournamentId, seasonId, ...rest } = parsed.data;

  await prisma.announcement.create({
    data: {
      ...rest,
      tournamentId: tournamentId && tournamentId.length > 0 ? tournamentId : null,
      seasonId: seasonId && seasonId.length > 0 ? seasonId : null,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/najave");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
  revalidatePath("/najave");
}
