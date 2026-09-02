"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { playerSchema } from "@/lib/validation/player";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseFormData(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    fideId: formData.get("fideId"),
    title: formData.get("title"),
    gender: formData.get("gender"),
    birthYear: formData.get("birthYear"),
    isClubMember: formData.get("isClubMember") === "on",
    memberSince: formData.get("memberSince"),
    memberUntil: formData.get("memberUntil"),
  };
}

export async function createPlayer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = playerSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { fideId, memberSince, memberUntil, ...rest } = parsed.data;
  const toDate = (v: string | undefined) =>
    v && v.length > 0 ? new Date(v) : null;

  try {
    const created = await prisma.player.create({
      data: {
        ...rest,
        fideId: fideId && fideId.length > 0 ? fideId : null,
        memberSince: toDate(memberSince),
        memberUntil: toDate(memberUntil),
      },
    });

    await logAudit({
      actor,
      action: "CREATE",
      entity: "Player",
      entityId: created.id,
      summary: `Dodan igrač ${created.lastName} ${created.firstName}`,
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
        errors: { fideId: ["Igrač s ovim FIDE ID-om već postoji."] },
      };
    }
    return { message: "Došlo je do greške pri spremanju igrača." };
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function updatePlayer(
  playerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = playerSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { fideId, memberSince, memberUntil, ...rest } = parsed.data;
  const toDate = (v: string | undefined) =>
    v && v.length > 0 ? new Date(v) : null;

  const before = await prisma.player.findUnique({ where: { id: playerId } });

  try {
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...rest,
        fideId: fideId && fideId.length > 0 ? fideId : null,
        memberSince: toDate(memberSince),
        memberUntil: toDate(memberUntil),
      },
    });

    await logAudit({
      actor,
      action: "UPDATE",
      entity: "Player",
      entityId: playerId,
      summary: `Izmijenjen igrač ${updated.lastName} ${updated.firstName}`,
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
        errors: { fideId: ["Igrač s ovim FIDE ID-om već postoji."] },
      };
    }
    return { message: "Došlo je do greške pri spremanju igrača." };
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function deletePlayer(playerId: string): Promise<void> {
  const actor = await requireAdmin();
  // Dohvat prije brisanja — nakon njega je audit trag jedini preostali zapis.
  const before = await prisma.player.findUnique({ where: { id: playerId } });
  try {
    await prisma.player.delete({ where: { id: playerId } });
    await logAudit({
      actor,
      action: "DELETE",
      entity: "Player",
      entityId: playerId,
      summary: `Obrisan igrač ${before ? `${before.lastName} ${before.firstName}` : playerId}`,
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
        "Ovaj igrač ima Hall of Fame zapis — obriši prvo taj zapis (Admin → Hall of Fame) ako stvarno želiš izbrisati igrača."
      );
    }
    throw err;
  }
  revalidatePath("/admin/players");
}
