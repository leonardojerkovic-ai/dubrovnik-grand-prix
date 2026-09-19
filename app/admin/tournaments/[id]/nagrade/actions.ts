"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { syncTournamentPrizes } from "@/lib/tournament-prizes";
import type { ActionState } from "../../../players/actions";

function optionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/**
 * Dodaje nagradu i odmah preračunava dodjelu.
 *
 * Prioritet se ne traži od admina nego se dodjeljuje sam, na kraj popisa.
 * Redoslijed unosa je ujedno i redoslijed priznanja, što odgovara načinu na
 * koji se nagrade pišu u raspisu — od ukupnog poretka prema kategorijama.
 * Premještanje gore-dolje radi se zasebnom akcijom.
 */
export async function createPrize(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (!tournamentId) return { errors: { label: ["Nedostaje turnir."] } };
  if (!label) return { errors: { label: ["Unesi naziv nagrade."] } };

  const count = optionalInt(formData.get("count")) ?? 1;
  if (count < 1 || count > 20) {
    return { errors: { count: ["Broj nagrada mora biti između 1 i 20."] } };
  }

  const genderRaw = String(formData.get("gender") ?? "");
  const gender = genderRaw === "M" || genderRaw === "F" ? genderRaw : null;

  const last = await prisma.tournamentPrize.findFirst({
    where: { tournamentId },
    orderBy: { priority: "desc" },
    select: { priority: true },
  });

  const shortLabel = String(formData.get("shortLabel") ?? "").trim();

  const created = await prisma.tournamentPrize.create({
    data: {
      tournamentId,
      label,
      shortLabel: shortLabel === "" ? null : shortLabel,
      priority: (last?.priority ?? 0) + 1,
      count,
      gender,
      birthYearMin: optionalInt(formData.get("birthYearMin")),
      birthYearMax: optionalInt(formData.get("birthYearMax")),
      ratingMin: optionalInt(formData.get("ratingMin")),
      ratingMax: optionalInt(formData.get("ratingMax")),
      clubMembersOnly: formData.get("clubMembersOnly") === "on",
    },
  });

  await logAudit({
    actor,
    action: "CREATE",
    entity: "TournamentPrize",
    entityId: created.id,
    summary: `Dodana nagrada "${created.label}"`,
    after: created,
  });

  const result = await syncTournamentPrizes(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}/nagrade`);
  revalidatePath(`/turniri/${tournamentId}`);

  return { message: `Nagrada dodana. Dodijeljeno ukupno: ${result.awarded}.` };
}

export async function deletePrize(prizeId: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.tournamentPrize.findUnique({
    where: { id: prizeId },
  });
  if (!before) return;

  await prisma.tournamentPrize.delete({ where: { id: prizeId } });

  await logAudit({
    actor,
    action: "DELETE",
    entity: "TournamentPrize",
    entityId: prizeId,
    summary: `Obrisana nagrada "${before.label}"`,
    before,
  });

  await syncTournamentPrizes(before.tournamentId);
  revalidatePath(`/admin/tournaments/${before.tournamentId}/nagrade`);
  revalidatePath(`/turniri/${before.tournamentId}`);
}

/**
 * Zamjenjuje mjesto nagrade u redoslijedu priznanja sa susjednom.
 *
 * Zamjena ide kroz tri koraka jer je (tournamentId, priority) jedinstven —
 * izravna zamjena dviju vrijednosti sudarila bi se s indeksom na pola puta.
 */
export async function movePrize(
  prizeId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  const prize = await prisma.tournamentPrize.findUnique({
    where: { id: prizeId },
  });
  if (!prize) return;

  const neighbour = await prisma.tournamentPrize.findFirst({
    where: {
      tournamentId: prize.tournamentId,
      priority:
        direction === "up" ? { lt: prize.priority } : { gt: prize.priority },
    },
    orderBy: { priority: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  const parking = -Math.abs(prize.priority) - 1000;

  await prisma.$transaction([
    prisma.tournamentPrize.update({
      where: { id: prize.id },
      data: { priority: parking },
    }),
    prisma.tournamentPrize.update({
      where: { id: neighbour.id },
      data: { priority: prize.priority },
    }),
    prisma.tournamentPrize.update({
      where: { id: prize.id },
      data: { priority: neighbour.priority },
    }),
  ]);

  await syncTournamentPrizes(prize.tournamentId);
  revalidatePath(`/admin/tournaments/${prize.tournamentId}/nagrade`);
  revalidatePath(`/turniri/${prize.tournamentId}`);
}

/** Ponovni izračun na zahtjev — npr. nakon ispravka rezultata. */
export async function recomputePrizes(tournamentId: string): Promise<void> {
  const actor = await requireAdmin();
  const result = await syncTournamentPrizes(tournamentId);

  await logAudit({
    actor,
    action: "RECALCULATE",
    entity: "TournamentPrize",
    entityId: tournamentId,
    summary: `Preračunate nagrade (${result.awarded} dodijeljeno)`,
    after: result,
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/nagrade`);
  revalidatePath(`/turniri/${tournamentId}`);
}
