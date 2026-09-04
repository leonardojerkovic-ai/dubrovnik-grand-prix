import {
  getGpAgeCategories,
  getGpVeteranCategories,
  isInU1800Category,
} from "./gp/categories";
import {
  parseRestrictions,
  GP_RESTRICTION_LABELS,
  type GpRestrictionCode,
} from "./gp/tournament-scope";
import { isEligibleForPoints } from "./akademija/formulas";

/**
 * Smije li igrač nastupiti na turniru.
 *
 * Dvije su vrste ograničenja i pravilnik ih tretira različito:
 *
 * GP (čl. 14): turnir ograničen po dobi, spolu ili rejtingu doslovno ne
 * dopušta nastup onima izvan kategorije — provjera je tvrda.
 *
 * Akademija (čl. 6): kvalifikacijski turniri otvoreni su svima koji
 * zadovoljavaju "uvjete raspisa", a čl. 3 govori o pravu na BODOVE, ne o
 * pravu nastupa. Zato ograničenje nije ugrađeno u pravilnik nego je
 * postavka po turniru, koju voditelj uključuje ili isključuje.
 */

export interface EligibilityPlayer {
  birthYear: number;
  gender: string;
  /** Rejting tempa u kojem se turnir igra, na dan provjere. */
  tempoRating: number | null;
  /** Rapid rejting — za uvjet iz čl. 3 Akademije. */
  rapidRating: number | null;
}

export interface EligibilityTournament {
  restrictedCategories: unknown;
  seasonSystem: "GP" | "AKADEMIJA";
  seasonStartYear: number;
  /** Akademija: vrijedi li ograničenje iz čl. 3 i za pravo nastupa. */
  academyPointsOnly: boolean;
}

export type EligibilityResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/** Pripada li igrač zadanoj kategoriji, za potrebe prava nastupa. */
function belongsTo(
  player: EligibilityPlayer,
  code: GpRestrictionCode,
  seasonStartYear: number
): boolean {
  if (code === "ZENE") return player.gender === "F";
  if (code === "U1800") return isInU1800Category(player.tempoRating);
  if (code === "U12" || code === "U16" || code === "U20") {
    return getGpAgeCategories(player.birthYear, seasonStartYear).includes(code);
  }
  return getGpVeteranCategories(player.birthYear, seasonStartYear).includes(code);
}

export function checkEligibility(
  player: EligibilityPlayer,
  tournament: EligibilityTournament
): EligibilityResult {
  const restrictions = parseRestrictions(tournament.restrictedCategories);

  for (const code of restrictions) {
    if (!belongsTo(player, code, tournament.seasonStartYear)) {
      return {
        allowed: false,
        reason: `Turnir je ograničen na kategoriju ${GP_RESTRICTION_LABELS[code]}, a ti joj ne pripadaš.`,
      };
    }
  }

  if (tournament.seasonSystem === "AKADEMIJA" && tournament.academyPointsOnly) {
    const ok = isEligibleForPoints({
      birthYear: player.birthYear,
      seasonStartYear: tournament.seasonStartYear,
      rapidRatingAtFirstTournament: player.rapidRating,
    });
    if (!ok) {
      return {
        allowed: false,
        reason:
          "Turniri Akademije namijenjeni su igračima godišta " +
          `${tournament.seasonStartYear - 14}. i mlađima s rapid rejtingom nižim od 1600 (čl. 3).`,
      };
    }
  }

  return { allowed: true };
}
