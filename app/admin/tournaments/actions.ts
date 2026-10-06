"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { revalidateSchedule, revalidateStandings } from "@/lib/revalidate";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  preracunajPrava,
  ucitajZapiseTurnira,
} from "@/lib/akademija/preracunaj-prava";
import { napomeni } from "@/lib/admin-odbijanje";
import { tournamentSchema } from "@/lib/validation/tournament";
import type { ActionState } from "../players/actions";
import { fieldErrorsFrom, formValuesFrom } from "@/lib/validation/errors";

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
    restrictedCategory: formData.get("restrictedCategory"),
    venue: formData.get("venue"),
    startTime: formData.get("startTime"),
    announcementUrl: formData.get("announcementUrl"),
    academyPointsOnly: formData.get("academyPointsOnly") === "on",
  };
}

export async function createTournament(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = tournamentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: fieldErrorsFrom(parsed.error), values: formValuesFrom(formData) };
  }

  const {
    level,
    baseMinutes,
    incrementSeconds,
    restrictedCategory,
    venue,
    startTime,
    announcementUrl,
    ...rest
  } = parsed.data;
  const blank = (v?: string) => (v && v.length > 0 ? v : null);

  const tournament = await prisma.tournament.create({
    data: {
      ...rest,
      venue: blank(venue),
      startTime: blank(startTime),
      announcementUrl: blank(announcementUrl),
      restrictedCategories:
        restrictedCategory && restrictedCategory.length > 0
          ? [restrictedCategory]
          : undefined,
      date: new Date(rest.date),
      level: level && level.length > 0 ? level : null,
      baseMinutes: baseMinutes === "" || baseMinutes == null ? null : baseMinutes,
      incrementSeconds:
        incrementSeconds === "" || incrementSeconds == null ? null : incrementSeconds,
    },
  });

  await logAudit({
    actor,
    action: "CREATE",
    entity: "Tournament",
    entityId: tournament.id,
    summary: `Stvoren turnir "${tournament.name}"`,
    after: tournament,
  });

  revalidatePath("/admin/tournaments");
  revalidateSchedule(tournament.id);
  redirect(`/admin/tournaments/${tournament.id}`);
}

export async function updateTournament(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsed = tournamentSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: fieldErrorsFrom(parsed.error), values: formValuesFrom(formData) };
  }

  const {
    level,
    baseMinutes,
    incrementSeconds,
    restrictedCategory,
    venue,
    startTime,
    announcementUrl,
    ...rest
  } = parsed.data;
  const blank = (v?: string) => (v && v.length > 0 ? v : null);
  const before = await prisma.tournament.findUnique({ where: { id: tournamentId } });

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      ...rest,
      venue: blank(venue),
      startTime: blank(startTime),
      announcementUrl: blank(announcementUrl),
      restrictedCategories:
        restrictedCategory && restrictedCategory.length > 0
          ? [restrictedCategory]
          : Prisma.DbNull,
      date: new Date(rest.date),
      level: level && level.length > 0 ? level : null,
      baseMinutes: baseMinutes === "" || baseMinutes == null ? null : baseMinutes,
      incrementSeconds:
        incrementSeconds === "" || incrementSeconds == null ? null : incrementSeconds,
    },
  });

  // Razina i tempo ulaze u izračun bodova (čl. 5), pa je izmjena turnira
  // nakon unesenih rezultata zahvat koji mora ostaviti trag.
  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Tournament",
    entityId: tournamentId,
    summary: `Izmijenjen turnir "${updated.name}"`,
    before,
    after: updated,
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  // Razina i tempo ulaze u izračun, pa se mijenjaju i ljestvice.
  revalidateSchedule(tournamentId);
  revalidateStandings(tournamentId);
  return { message: "Spremljeno." };
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const actor = await requireAdmin();
  const before = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { results: true } } },
  });

  /**
   * Brisanje turnira ostavljalo je zaključano pravo na bodove (čl. 3).
   *
   * Veza AcademyEligibility → Tournament je SetNull, pa je zapis preživio
   * brisanje: ostao je s datumom obrisanog turnira i time i dalje zaključavao
   * svaki kasniji turnir sezone. Igrač koji je na greškom unesenom turniru
   * dobio „nema prava" nosio bi to do kraja sezone, i to bez ikakva traga.
   *
   * Zato se u istoj transakciji pravo preračunava po najranijem preostalom
   * nastupu. Rezultati obrisanog turnira nestaju s njim (Cascade), pa upit
   * više ne vidi ni njih.
   */
  const prerac = before
    ? await prisma.$transaction(async (tx) => {
        // Zapisi se čitaju PRIJE brisanja: veza je SetNull, pa bi nakon
        // njega upit po firstTournamentId vratio prazno.
        const zapisi = await ucitajZapiseTurnira(
          tx,
          before.seasonId,
          tournamentId
        );
        await tx.tournament.delete({ where: { id: tournamentId } });
        return preracunajPrava(tx, {
          seasonId: before.seasonId,
          tournamentId,
          zapisi,
        });
      })
    : { promijenjeno: [], bezNastupa: [] };

  await logAudit({
    actor,
    action: "DELETE",
    entity: "Tournament",
    entityId: tournamentId,
    summary:
      `Obrisan turnir "${before?.name ?? tournamentId}"` +
      (before?._count.results ? ` s ${before._count.results} rezultata` : "") +
      (prerac.promijenjeno.length > 0
        ? `; pravo na bodove preračunato i promijenjeno: ${prerac.promijenjeno.join(", ")}`
        : "") +
      (prerac.bezNastupa.length > 0
        ? `; bez drugog nastupa u sezoni, zapis o pravu uklonjen: ${prerac.bezNastupa.join(", ")}`
        : ""),
    before,
  });
  revalidatePath("/admin/tournaments");
  revalidateSchedule(tournamentId);
  revalidateStandings();

  if (prerac.promijenjeno.length > 0 || prerac.bezNastupa.length > 0) {
    const dijelovi: string[] = [];
    if (prerac.promijenjeno.length > 0) {
      dijelovi.push(
        `pravo na bodove (čl. 3) preračunato je po najranijem preostalom nastupu i ODLUKA SE PROMIJENILA za: ${prerac.promijenjeno.join(", ")} — bodovi na njihovim turnirima ove sezone računati su po staroj odluci, spremi te turnire ponovno`
      );
    }
    if (prerac.bezNastupa.length > 0) {
      dijelovi.push(
        `bez drugog nastupa u sezoni, pa je zapis o pravu uklonjen za: ${prerac.bezNastupa.join(", ")}`
      );
    }
    napomeni(
      "/admin/tournaments",
      `Turnir je obrisan, ali ${dijelovi.join("; ")}.`
    );
  }
}
