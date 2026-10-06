import { isEligibleForPoints } from "../scoring/akademija/formulas";

/**
 * Pravo igrača na bodove u GP-u Akademije — čl. 3, sama odluka.
 *
 * Bez Prisme, da se može testirati: isti razlog zbog kojega su i druge
 * sitnice oko bodovanja čiste funkcije (vidi lib/ratings/vrijednost.ts).
 * Čitanje i upis su u eligibility.ts.
 *
 * Pravo se veže uz dan prvog nastupa u sezoni i vrijedi do kraja sezone.
 * Igrač koji na prvom turniru ima rapid 1580 zadržava pravo i ako do svibnja
 * naraste na 1700; obrnuto, tko na prvom nastupu ima 1620, ne stječe ga ako
 * kasnije padne.
 */

export interface PostojecePravo {
  isEligible: boolean;
  /**
   * Turnir na kojem je pravo utvrđeno. Može biti prazan: veza je
   * onDelete: SetNull, pa brisanje turnira ostavi zapis bez njega.
   */
  firstTournamentId: string | null;
  firstTournamentDate: Date;
}

export interface ZapisPrava {
  playerId: string;
  isEligible: boolean;
  firstTournamentId: string;
  firstTournamentDate: Date;
  rapidRatingAtFirst: number | null;
  birthYearUsed: number;
}

export interface OdlukaPrava {
  playerId: string;
  isEligible: boolean;
  /**
   * locked — pravo je zaključano na ranijem turniru (ili na drugom turniru
   *   istog dana) i ne dira se.
   * new — prvi nastup u sezoni, pravo se utvrđuje sada.
   * refreshed — ponovno spremanje ISTOG turnira na kojem je pravo utvrđeno;
   *   preračunava se, pa ispravak rejtinga ili godišta ima učinak.
   * recomputed — unesen je turnir RANIJI od dosad zabilježenog prvog
   *   nastupa; pravo se utvrđuje po njemu, a kasniji turniri sezone traže
   *   provjeru.
   */
  status: "locked" | "new" | "refreshed" | "recomputed";
  /** Što treba upisati; prazno kad je pravo već zaključano. */
  zaUpis: ZapisPrava | null;
  /**
   * Zapis se zadržava, ali bi izračun po OVOM turniru dao drukčiju odluku.
   *
   * Javlja se samo uz status "locked", i to u praksi samo za drugi turnir
   * istog dana: tada se postojeći zapis ne prepisuje (vidi odluciPravo), ali
   * admin mora znati da se podaci ne slažu — bodovi su negdje izračunati po
   * jednoj odluci, a rejting s ovog turnira daje drugu.
   */
  odlukaBiSeRazlikovala?: boolean;
}

/**
 * Odluka za jednog igrača. Čista funkcija — bez baze, pa se može testirati.
 *
 * Zapis se smatra zaključanim samo ako je nastao na STROGO ranijem turniru.
 * Ponovno spremanje ISTOG turnira mora proći kroz izračun, inače ispravak
 * rejtinga ili godišta na tom turniru ostane bez učinka, a admin o tome ne
 * dobije nikakvu poruku.
 */
export function odluciPravo(input: {
  postojeci?: PostojecePravo;
  tournamentId: string;
  tournamentDate: Date;
  playerId: string;
  birthYear: number;
  seasonStartYear: number;
  rapidRatingAtThisTournament: number | null;
}): OdlukaPrava {
  const { postojeci, tournamentDate, tournamentId, playerId } = input;

  const isEligible = isEligibleForPoints({
    birthYear: input.birthYear,
    seasonStartYear: input.seasonStartYear,
    rapidRatingAtFirstTournament: input.rapidRatingAtThisTournament,
  });

  // Zaključano na STROGO ranijem turniru — vrijednost stoji, ništa se ne piše.
  if (
    postojeci &&
    postojeci.firstTournamentDate.getTime() < tournamentDate.getTime()
  ) {
    return {
      playerId,
      isEligible: postojeci.isEligible,
      status: "locked",
      zaUpis: null,
    };
  }

  /**
   * Isti turnir — ponovno spremanje. Preračunava se, pa ispravak rejtinga ili
   * godišta na tom turniru ima učinak. ID može biti prazan (turnir je
   * obrisan), pa se tada pada na datum.
   */
  const istiTurnir = postojeci
    ? postojeci.firstTournamentId === tournamentId ||
      (postojeci.firstTournamentId === null &&
        postojeci.firstTournamentDate.getTime() === tournamentDate.getTime())
    : false;

  /**
   * DRUGI turnir istog dana: zapis se ZADRŽAVA.
   *
   * Čl. 3 veže pravo uz dan prvog nastupa, a dan je isti — pa među njima
   * nema „ranijeg" i nema razloga da pobijedi onaj koji je slučajno zadnji
   * spremljen. Prepisivanje je uz to bilo i opasno: zapis bi upućivao na
   * turnir Y, a brisanje igrača s Y odnijelo bi mu pravo premda je istog dana
   * igrao X. Ako bi izračun po ovom turniru dao drukčiju odluku, to se javlja
   * adminu, jer su tada bodovi negdje izračunati po drugoj odluci.
   */
  const istiDan = postojeci
    ? postojeci.firstTournamentDate.getTime() === tournamentDate.getTime()
    : false;

  if (postojeci && istiDan && !istiTurnir) {
    return {
      playerId,
      isEligible: postojeci.isEligible,
      status: "locked",
      zaUpis: null,
      odlukaBiSeRazlikovala: isEligible !== postojeci.isEligible,
    };
  }

  // Ostaje: ili prvi nastup, ili ponovno spremanje istog turnira, ili je
  // naknadno unesen turnir RANIJI od zabilježenog prvog nastupa — tada se
  // pravo utvrđuje po njemu, a kasniji turniri sezone traže provjeru.
  const status = !postojeci ? "new" : istiTurnir ? "refreshed" : "recomputed";

  return {
    playerId,
    isEligible,
    status,
    zaUpis: {
      playerId,
      isEligible,
      firstTournamentId: tournamentId,
      firstTournamentDate: tournamentDate,
      rapidRatingAtFirst: input.rapidRatingAtThisTournament,
      birthYearUsed: input.birthYear,
    },
  };
}
