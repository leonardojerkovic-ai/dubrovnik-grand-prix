import { prisma } from "@/lib/prisma";
import { calculateQuota } from "@/lib/scoring/gp/standings";
import {
  tournamentEntersStanding,
  parseRestrictions,
  GP_RESTRICTION_LABELS,
  type GpStandingCode,
} from "@/lib/scoring/gp/tournament-scope";

/**
 * Provjera postavki sezone.
 *
 * Kvota se po čl. 16 računa iz broja redovnih turnira u OBJAVLJENOM
 * KALENDARU, dakle iz onoga što je u bazi. Dok se kalendar unosi turnir po
 * turnir, kvota je cijelo vrijeme premala — a to nigdje ne prijavi grešku.
 * Isto vrijedi za krivo označeno ograničenje kategorije: turnir jednostavno
 * ne uđe u ljestvicu u koju je trebao i nitko to ne primijeti.
 *
 * Ova analiza pokazuje što bi iz trenutnih podataka stvarno proizašlo, da se
 * može usporediti s onim što u pravilniku piše.
 */

export const GP_STANDINGS: { code: GpStandingCode; label: string }[] = [
  { code: "OPCI", label: "Opći GP" },
  { code: "ZENE", label: "Žene" },
  { code: "U20", label: "Juniori U20" },
  { code: "U16", label: "Kadeti U16" },
  { code: "U12", label: "Mlađi kadeti U12" },
  { code: "S50", label: "Veterani +50" },
  { code: "S65", label: "Veterani +65" },
  { code: "U1800", label: "U1800" },
];

export interface StandingSummary {
  code: GpStandingCode;
  label: string;
  regularCount: number;
  quota: number;
  /** Kvota je pala na zakonski minimum — gotovo uvijek nedovršen kalendar. */
  atMinimum: boolean;
  finals: string[];
}

export interface TournamentSummary {
  id: string;
  name: string;
  date: Date;
  level: string | null;
  tempo: string;
  rounds: number;
  status: string;
  isFinal: boolean;
  isJuniorFinal: boolean;
  restrictionLabel: string | null;
  standings: string[];
}

export interface SeasonWarning {
  severity: "greska" | "upozorenje";
  message: string;
}

export interface SeasonOverview {
  seasonId: string;
  yearLabel: string;
  system: "GP" | "AKADEMIJA";
  rulebookVersion: string | null;
  tournamentCount: number;
  regularCount: number;
  finalCount: number;
  standings: StandingSummary[];
  tournaments: TournamentSummary[];
  warnings: SeasonWarning[];
}

export async function getSeasonOverview(
  seasonId: string
): Promise<SeasonOverview | null> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { tournaments: { orderBy: { date: "asc" } } },
  });
  if (!season) return null;

  const isGp = season.system === "GP";
  const warnings: SeasonWarning[] = [];

  const tournaments: TournamentSummary[] = season.tournaments.map((t) => {
    const restrictions = parseRestrictions(t.restrictedCategories);
    const standings = isGp
      ? GP_STANDINGS.filter((s) => tournamentEntersStanding(t, s.code)).map(
          (s) => s.label
        )
      : ["GP Akademije"];

    return {
      id: t.id,
      name: t.name,
      date: t.date,
      level: t.level,
      tempo: t.tempo,
      rounds: t.rounds,
      status: t.status,
      isFinal: t.isFinal,
      isJuniorFinal: t.isJuniorFinal,
      restrictionLabel:
        restrictions.length > 0
          ? restrictions.map((r) => GP_RESTRICTION_LABELS[r]).join(" + ")
          : null,
      standings,
    };
  });

  const standings: StandingSummary[] = isGp
    ? GP_STANDINGS.map(({ code, label }) => {
        const regular = season.tournaments.filter(
          (t) => !t.isFinal && tournamentEntersStanding(t, code)
        ).length;
        const finals = season.tournaments
          .filter((t) => t.isFinal && tournamentEntersStanding(t, code))
          .map((t) => t.name);

        const quota = calculateQuota(regular);
        return {
          code,
          label,
          regularCount: regular,
          quota,
          atMinimum: quota === 5 && regular < 10,
          finals,
        };
      })
    : [];

  // --- Upozorenja ---

  if (!season.rulebookVersion) {
    warnings.push({
      severity: "upozorenje",
      message:
        "Sezoni nije upisana verzija pravilnika. Bez nje se u snapshot rezultata bilježi trenutna verzija iz koda, pa se poslije ne vidi po kojoj je verziji rezultat nastao (čl. 30).",
    });
  }

  for (const t of tournaments) {
    if (t.standings.length === 0) {
      warnings.push({
        severity: "greska",
        message: `Turnir „${t.name}“ ne ulazi ni u jednu ljestvicu. Bodovi bi se izračunali, ali se nigdje ne bi zbrajali — provjeri ograničenje prava nastupa.`,
      });
    }
    if (isGp && !t.level) {
      warnings.push({
        severity: "greska",
        message: `Turniru „${t.name}“ nije određena razina, a ona ulazi u izračun bodova (čl. 11).`,
      });
    }
    if (t.rounds <= 0) {
      warnings.push({
        severity: "upozorenje",
        message: `Turniru „${t.name}“ nije upisan broj kola.`,
      });
    }
    if (t.isJuniorFinal && !t.isFinal) {
      warnings.push({
        severity: "greska",
        message: `„${t.name}“ je označen kao Juniorsko Finale, ali ne i kao završni turnir — rezultat tada ne bi bio zaštićen od odbacivanja (čl. 20 st. 6).`,
      });
    }
  }

  const atMinimum = standings.filter((s) => s.atMinimum);
  if (atMinimum.length > 0) {
    warnings.push({
      severity: "upozorenje",
      message: `Kvota je na najmanjoj dopuštenoj vrijednosti (5) za: ${atMinimum
        .map((s) => s.label)
        .join(", ")}. To gotovo uvijek znači da kalendar još nije unesen do kraja.`,
    });
  }

  if (isGp) {
    const hasFinal = season.tournaments.some((t) => t.isFinal && !t.isJuniorFinal);
    if (!hasFinal) {
      warnings.push({
        severity: "upozorenje",
        message:
          "U kalendaru nema Grand Prix Finala. Bez njega igrači nemaju zaštićeni rezultat iz čl. 17.",
      });
    }
  } else {
    const finals = season.tournaments.filter((t) => t.isFinal).length;
    if (finals === 0) {
      warnings.push({
        severity: "upozorenje",
        message:
          "U kalendaru nema Prvenstva Akademije. Bez njega konačni poredak nema obvezni rezultat iz čl. 14.",
      });
    }
    const qualifiers = season.tournaments.filter((t) => !t.isFinal).length;
    if (qualifiers > 0 && qualifiers < 6) {
      warnings.push({
        severity: "upozorenje",
        message: `Uneseno je ${qualifiers} kvalifikacijskih turnira, a čl. 5 predviđa 6.`,
      });
    }
  }

  return {
    seasonId: season.id,
    yearLabel: season.yearLabel,
    system: season.system as "GP" | "AKADEMIJA",
    rulebookVersion: season.rulebookVersion,
    tournamentCount: season.tournaments.length,
    regularCount: season.tournaments.filter((t) => !t.isFinal).length,
    finalCount: season.tournaments.filter((t) => t.isFinal).length,
    standings,
    tournaments,
    warnings,
  };
}
