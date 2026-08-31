"use server";

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
    birthDate: formData.get("birthDate"),
    isClubMember: formData.get("isClubMember") === "on",
  };
}

export async function createPlayer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = playerSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { fideId, birthDate, ...rest } = parsed.data;

  try {
    await prisma.player.create({
      data: {
        ...rest,
        fideId: fideId && fideId.length > 0 ? fideId : null,
        birthDate: birthDate && birthDate.length > 0 ? new Date(birthDate) : null,
      },
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
  const parsed = playerSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { fideId, birthDate, ...rest } = parsed.data;

  try {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        ...rest,
        fideId: fideId && fideId.length > 0 ? fideId : null,
        birthDate: birthDate && birthDate.length > 0 ? new Date(birthDate) : null,
      },
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
  try {
    await prisma.player.delete({ where: { id: playerId } });
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
