"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tournamentSchema } from "@/lib/validation/tournament";
import type { ActionState } from "../players/actions";

function parseFormData(formData: FormData) {
  return {
    seasonId: formData.get("seasonId"),
    name: formData.get("name"),
    date: formData.get("date"),
    format: formData.get("format"),
    rounds: formData.get("rounds"),
    level: formData.get("level"),
    tempo: formData.get("tempo"),
    baseMinutes: formData.get("baseMinutes"),
    incrementSeconds: formData.get("incrementSeconds"),
    isFinal: formData.get("isFinal") === "on",
    isJuniorFinal: formData.get("isJuniorFinal") === "on",
    status: formData.get("status"),
  };
}

export async function createTournament(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = tournamentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { level, baseMinutes, incrementSeconds, ...rest } = parsed.data;

  const tournament = await prisma.tournament.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      level: level && level.length > 0 ? level : null,
      baseMinutes: baseMinutes === "" || baseMinutes == null ? null : baseMinutes,
      incrementSeconds:
        incrementSeconds === "" || incrementSeconds == null ? null : incrementSeconds,
    },
  });

  revalidatePath("/admin/tournaments");
  redirect(`/admin/tournaments/${tournament.id}`);
}

export async function updateTournament(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = tournamentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { level, baseMinutes, incrementSeconds, ...rest } = parsed.data;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      ...rest,
      date: new Date(rest.date),
      level: level && level.length > 0 ? level : null,
      baseMinutes: baseMinutes === "" || baseMinutes == null ? null : baseMinutes,
      incrementSeconds:
        incrementSeconds === "" || incrementSeconds == null ? null : incrementSeconds,
    },
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { message: "Spremljeno." };
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/admin/tournaments");
}
