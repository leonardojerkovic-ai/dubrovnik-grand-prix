"use server";

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
  const parsed = documentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { seasonId, ...rest } = parsed.data;

  await prisma.document.create({
    data: {
      ...rest,
      seasonId: seasonId && seasonId.length > 0 ? seasonId : null,
    },
  });

  revalidatePath("/admin/documents");
  revalidatePath("/dokumenti");
  redirect("/admin/documents");
}

export async function deleteDocument(documentId: string): Promise<void> {
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/admin/documents");
  revalidatePath("/dokumenti");
}
