"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateAverageRating,
  calculateGpPoints,
  type TournamentLevel,
  type Tempo,
} from "@/lib/scoring/gp/formulas";
import {
  calculateFinalPoints,
  calculateQualifierPoints,
} from "@/lib/scoring/akademija/formulas";
import {
  buildAkademijaSnapshot,
  buildGpSnapshot,
  type ScoringSnapshot,
} from "@/lib/scoring/rulebook";
import { resolveAcademyEligibility } from "@/lib/akademija/eligibility";
import { wasClubMemberOn } from "@/lib/membership";
import { validateRanks } from "@/lib/scoring/ranks";
import {
  getLockStatus,
  lockedMessage,
  unlockExpiry,
} from "@/lib/scoring/results-lock";

export type ResultRow = {
  playerId: string;
  rank: number;
  /** Rejting ručno unesen od admina za ovaj turnir (nema li ga, tretira se kao 1400 — čl. 7 / interna konvencija). Za Akademiju: ako je unesen, koristi se i kao rapid rejting za provjeru prava na bodove (čl. 3). */
  rating: number | null;
  /** Je li igrač odigrao barem jednu partiju — false znači isključen iz N (čl. 5) */
  gamesPlayed: boolean;
};

export type SaveResultsState = {
  message?: string;
  error?: string;
};

/**
 * Sprema rezultate turnira i računa GP bodove za svakog igrača preko
 * bodovnog enginea (lib/scoring). Grana se na GP ili Akademija formulu
 * ovisno o sustavu sezone kojoj turnir pripada.
 */
export async function saveTournamentResults(
  tournamentId: string,
  rows: ResultRow[]
): Promise<SaveResultsState> {
  const actor = await requireAdmin();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { season: true },
  });

  if (!tournament) {
    return { error: "Turnir nije pronađen." };
  }

  // Čl. 29: nakon isteka roka za prigovor rezultat je konačan. Izmjena tada
  // traži izričito otključavanje uz obrazloženje.
  const lock = getLockStatus(tournament);
  if (!lock.editable) {
    return { error: lockedMessage(lock.objectionDeadline) };
  }

  const playedRows = rows.filter((r) => r.gamesPlayed);
  const N = playedRows.length;

  if (N === 0) {
    return { error: "Nema unesenih igrača koji su odigrali partiju." };
  }

  // Plasman mora biti jedinstven (čl. 10 Akademije: "Konačni plasman (R)
  // uvijek je jedinstven") i mora činiti niz 1..N — formula iz čl. 5 računa
  // (N − R + 1) / N, pa R izvan tog raspona daje besmislen omjer.
  // Ravnopravnost se razrješava pomoćnim kriterijima turnira, ne dijeljenim
  // mjestom u unosu.
  const rankError = validateRanks(playedRows);
  if (rankError) {
    return { error: rankError };
  }

  try {
    // points: null znači "igrač je odigrao, ulazi u N, ali nema pravo na
    // bodove" (npr. čl. 3 kod Akademije) — razlikuje se od "nije odigrao".
    const pointsByPlayer = new Map<
      string,
      {
        points: number | null;
        ratingUsed: number | null;
        snapshot: ScoringSnapshot;
      }
    >();
    const ineligiblePlayers: string[] = [];
    const recomputedPlayers: string[] = [];
    const ruleVersion = tournament.season.rulebookVersion;

    // Članstvo NA DAN TURNIRA (čl. 4) — zapisuje se uz rezultat i poslije se
    // ne mijenja. Naknadno učlanjenje ne djeluje retroaktivno.
    const membershipPlayers = await prisma.player.findMany({
      where: { id: { in: playedRows.map((r) => r.playerId) } },
      select: {
        id: true,
        isClubMember: true,
        memberSince: true,
        memberUntil: true,
      },
    });
    const membershipById = new Map(membershipPlayers.map((p) => [p.id, p]));
    const memberOnDate = (playerId: string): boolean => {
      const p = membershipById.get(playerId);
      return p ? wasClubMemberOn(p, tournament.date) : false;
    };

    if (tournament.season.system === "GP") {
      if (!tournament.level) {
        return {
          error:
            "Turnir pripada Dubrovnik GP sustavu i mora imati postavljenu razinu (KLUPSKA/NATJECATELJSKA/VRHUNSKA) prije unosa rezultata.",
        };
      }
      if (N < 6) {
        return {
          error:
            "Turnir s manje od 6 igrača ne ulazi u GP (čl. 6) — bodovi se ne mogu izračunati.",
        };
      }

      const averageRating = calculateAverageRating(playedRows.map((r) => r.rating));

      for (const row of playedRows) {
        const points = calculateGpPoints({
          playerCount: N,
          rank: row.rank,
          level: tournament.level as TournamentLevel,
          tempo: tournament.tempo as Tempo,
          averageRating,
        });
        const snapshot = buildGpSnapshot({
          playerCount: N,
          rank: row.rank,
          level: tournament.level as TournamentLevel,
          tempo: tournament.tempo as Tempo,
          averageRating,
          points,
          ruleVersion,
        });

        pointsByPlayer.set(row.playerId, {
          points,
          ratingUsed: row.rating,
          snapshot,
        });
      }
    } else {
      // AKADEMIJA
      if (N < 7) {
        return {
          error:
            "Turnir s manje od 7 igrača ne ulazi u GP Akademije (čl. 6) — bodovi se ne mogu izračunati.",
        };
      }

      // Godište za provjeru prava na bodove (čl. 3) — pravo imaju godišta
      // G−14 i mlađa, gdje je G godina početka sezone.
      const players = await prisma.player.findMany({
        where: { id: { in: playedRows.map((r) => r.playerId) } },
        select: { id: true, birthYear: true, lastName: true, firstName: true },
      });
      const playerById = new Map(players.map((p) => [p.id, p]));
      const seasonStartYear = tournament.season.startDate.getFullYear();

      for (const row of playedRows) {
        const player = playerById.get(row.playerId);
        const label = player
          ? `${player.lastName} ${player.firstName}`
          : `nepoznat igrač (${row.playerId})`;

        // Pravo na bodove veže se uz PRVI nastup u sezoni i zaključava se
        // (čl. 3). Kasniji rast rejtinga preko 1600 ne ukida već stečeno
        // pravo, niti pad ispod 1600 pravo naknadno stvara.
        const { isEligible, status } = await resolveAcademyEligibility({
          seasonId: tournament.seasonId,
          seasonStartDate: tournament.season.startDate,
          tournamentId: tournament.id,
          tournamentDate: tournament.date,
          playerId: row.playerId,
          birthYear: player?.birthYear ?? 0,
          rapidRatingAtThisTournament: row.rating,
        });

        if (status === "recomputed") {
          recomputedPlayers.push(label);
        }

        if (!isEligible) {
          ineligiblePlayers.push(label);
          pointsByPlayer.set(row.playerId, {
            points: null,
            ratingUsed: row.rating,
            snapshot: buildAkademijaSnapshot({
              playerCount: N,
              rank: row.rank,
              isFinal: tournament.isFinal,
              eligible: false,
              points: null,
              ruleVersion,
            }),
          });
          continue;
        }

        const points = tournament.isFinal
          ? calculateFinalPoints({ playerCount: N, rank: row.rank })
          : calculateQualifierPoints({ playerCount: N, rank: row.rank });

        pointsByPlayer.set(row.playerId, {
          points,
          ratingUsed: row.rating,
          snapshot: buildAkademijaSnapshot({
            playerCount: N,
            rank: row.rank,
            isFinal: tournament.isFinal,
            eligible: true,
            points,
            ruleVersion,
          }),
        });
      }
    }

    // Igrači koji su maknuti s popisa ili prebačeni u "nije odigrao" ne smiju
    // ostati u bazi sa starim plasmanom — inače bi iskrivili ljestvicu i
    // sudarili se s jedinstvenim indeksom na (tournamentId, rank).
    const keepPlayerIds = playedRows.map((r) => r.playerId);
    await prisma.tournamentResult.deleteMany({
      where: { tournamentId, playerId: { notIn: keepPlayerIds } },
    });

    // Upsert svakog rezultata (omogućava naknadnu korekciju prije zaključavanja)
    await prisma.$transaction(
      playedRows.map((row) => {
        const calc = pointsByPlayer.get(row.playerId)!;
        return prisma.tournamentResult.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId: row.playerId,
            },
          },
          create: {
            tournamentId,
            playerId: row.playerId,
            rank: row.rank,
            gamesPlayed: true,
            wasClubMember: memberOnDate(row.playerId),
            ratingSnapshotUsed: calc.ratingUsed,
            ratingOverridden: true,
            gpPoints: calc.points,
            scoringSnapshot: calc.snapshot as unknown as Prisma.InputJsonObject,
          },
          update: {
            rank: row.rank,
            gamesPlayed: true,
            wasClubMember: memberOnDate(row.playerId),
            ratingSnapshotUsed: calc.ratingUsed,
            gpPoints: calc.points,
            scoringSnapshot: calc.snapshot as unknown as Prisma.InputJsonObject,
          },
        });
      })
    );

    // Prva objava pokreće rok za prigovor (čl. 29). Kasnije izmjene unutar
    // roka ne pomiču ga — inače bi se rok mogao produljivati unedogled.
    if (!tournament.resultsPublishedAt) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { resultsPublishedAt: new Date() },
      });
    }

    // Najvažniji zapis u cijelom tragu: rezultati određuju bodove, a čl. 29
    // daje pravo prigovora. Snimaju se svi plasmani i izračunati bodovi.
    await logAudit({
      actor,
      action: "RECALCULATE",
      entity: "TournamentResult",
      entityId: tournamentId,
      summary: `Spremljeni rezultati turnira "${tournament.name}" (${N} igrača)`,
      after: {
        tournamentName: tournament.name,
        playerCount: N,
        results: playedRows.map((row) => ({
          playerId: row.playerId,
          rank: row.rank,
          gpPoints: pointsByPlayer.get(row.playerId)?.points ?? null,
        })),
      },
    });

    revalidatePath(`/admin/tournaments/${tournamentId}/results`);

    const eligibleCount = N - ineligiblePlayers.length;
    let message = `Spremljeno — bodovi izračunati za ${eligibleCount} igrača.`;
    if (ineligiblePlayers.length > 0) {
      message += ` Bez prava na bodove (čl. 3 — godište ili rapid rejting): ${ineligiblePlayers.join(", ")}.`;
    }
    if (recomputedPlayers.length > 0) {
      message +=
        ` UPOZORENJE: ovaj turnir je raniji od dosad zabilježenog prvog nastupa za: ${recomputedPlayers.join(", ")}.` +
        " Pravo na bodove preračunato je prema njemu — provjerite rezultate tih igrača na kasnijim turnirima sezone.";
    }

    return { message };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Došlo je do neočekivane greške pri izračunu bodova." };
  }
}


/**
 * Privremeno otključava konačne rezultate radi ispravka (čl. 29).
 *
 * Ne briše datum objave — rok za prigovor ostaje onaj izvorni. Otvara samo
 * prozor od dva sata, uz obavezno obrazloženje koje ide u audit log. Time
 * ispravak ostaje moguć, ali nikad neprimijećen.
 */
export async function unlockTournamentResults(
  tournamentId: string,
  reason: string
): Promise<{ error?: string; message?: string }> {
  const actor = await requireAdmin();

  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return {
      error: "Obrazloženje je obavezno i mora imati najmanje 10 znakova.",
    };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      name: true,
      resultsPublishedAt: true,
      unlockedUntil: true,
    },
  });

  if (!tournament) {
    return { error: "Turnir nije pronađen." };
  }

  const lock = getLockStatus(tournament);
  if (lock.editable) {
    return { error: "Rezultati nisu zaključani — otključavanje nije potrebno." };
  }

  const until = unlockExpiry(new Date());

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      unlockedUntil: until,
      unlockReason: trimmed,
      unlockedByEmail: actor.email,
    },
  });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "Tournament",
    entityId: tournamentId,
    summary: `Otključani konačni rezultati turnira "${tournament.name}": ${trimmed}`,
    after: { unlockedUntil: until.toISOString(), reason: trimmed },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/results`);
  return {
    message: `Rezultati su otključani do ${new Intl.DateTimeFormat("hr-HR", {
      timeStyle: "short",
    }).format(until)}.`,
  };
}
