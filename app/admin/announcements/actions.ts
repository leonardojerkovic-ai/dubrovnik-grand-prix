"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validation/announcement";
import type { ActionState } from "../players/actions";

export async function createAnnouncement(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
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

  const created = await prisma.announcement.create({
    data: {
      ...rest,
      tournamentId: tournamentId && tournamentId.length > 0 ? tournamentId : null,
      seasonId: seasonId && seasonId.length > 0 ? seasonId : null,
    },
  });

  await logAudit({
    actor,
    action: "CREATE",
    entity: "Announcement",
    entityId: created.id,
    summary: `Objavljena najava "${created.title}"`,
    after: created,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/najave");
  revalidatePath("/");
  revalidatePath("/najave");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.announcement.findUnique({ where: { id } });
  await prisma.announcement.delete({ where: { id } });
  await logAudit({
    actor,
    action: "DELETE",
    entity: "Announcement",
    entityId: id,
    summary: `Obrisana najava "${before?.title ?? id}"`,
    before,
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/najave");
}

/**
 * Uređivanje objavljene najave.
 *
 * Postoji zato što se najava mijenja češće nego što se čini: ispravi se
 * datum u tekstu, naknadno se poveže s turnirom, dopuni satnica. Bez toga
 * je jedini put bio obrisati je i napisati iznova, čime se gubi datum
 * objave i trag.
 *
 * Datum objave se NE mijenja — najava je objavljena onda kad jest, a
 * arhiviranje se po njemu i ravna.
 */
export async function updateAnnouncement(
  announcementId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
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
  const before = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...rest,
      tournamentId: tournamentId && tournamentId.length > 0 ? tournamentId : null,
      seasonId: seasonId && seasonId.length > 0 ? seasonId : null,
    },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Announcement",
    entityId: announcementId,
    summary: `Izmijenjena najava "${updated.title}"`,
    before,
    after: updated,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/najave");
  revalidatePath("/");
  return { message: "Spremljeno." };
}
