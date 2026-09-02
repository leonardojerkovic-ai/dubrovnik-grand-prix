"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/validation/document";
import type { ActionState } from "../players/actions";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    fileUrl: formData.get("fileUrl"),
    category: formData.get("category"),
    seasonId: formData.get("seasonId"),
  };
}

export async function createDocument(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = documentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { seasonId, ...rest } = parsed.data;

  const created = await prisma.document.create({
    data: {
      ...rest,
      seasonId: seasonId && seasonId.length > 0 ? seasonId : null,
    },
  });

  await logAudit({
    actor,
    action: "CREATE",
    entity: "Document",
    entityId: created.id,
    summary: `Dodan dokument "${created.title}"`,
    after: created,
  });

  revalidatePath("/admin/documents");
  revalidatePath("/dokumenti");
  redirect("/admin/documents");
}

export async function deleteDocument(documentId: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.document.findUnique({ where: { id: documentId } });
  await prisma.document.delete({ where: { id: documentId } });
  await logAudit({
    actor,
    action: "DELETE",
    entity: "Document",
    entityId: documentId,
    summary: `Obrisan dokument "${before?.title ?? documentId}"`,
    before,
  });
  revalidatePath("/admin/documents");
  revalidatePath("/dokumenti");
}
