/**
 * Medalje — GP Akademije
 * Reference: čl. 19
 *
 * Doslovan tekst članka:
 *   "Na svakom kvalifikacijskom turniru medalje se dodjeljuju: prvoplasiranima
 *    na 1., 2. i 3. mjestu, najboljem igraču u kategoriji U12, najboljem
 *    igraču u kategoriji U10, najboljem igraču u kategoriji U08, najboljoj
 *    igračici.
 *    Na Prvenstvu Akademije medalje se dodjeljuju prvoplasiranima na 1., 2. i
 *    3. mjestu.
 *    Za konačni poredak GP-a Akademije medalje se dodjeljuju: prvoplasiranima
 *    na 1., 2. i 3. mjestu ukupnog poretka, prvoj trojici u kategoriji U12,
 *    prvoj trojici u kategoriji U10, prvoj trojici u kategoriji U08, prvim
 *    trima igračicama.
 *    Medalje nisu kumulativne. Igrač na jednom turniru odnosno u jednom
 *    konačnom poretku prima najviše jednu medalju, i to za najviše priznanje
 *    koje je ostvario. Kategorijska medalja koja time ostaje slobodna pripada
 *    sljedećem igraču te kategorije."
 *
 * Članak ne nabraja izrijekom što je "više" priznanje kad igrač zadovolji
 * više kategorija odjednom (a po čl. 20 najmlađi igrač je istovremeno u U12,
 * U10 i U08). Redoslijed je zato propisan ovdje, na jednom mjestu, kao
 * MEDAL_PRIORITY: ukupni poredak, pa U12, U10, U08, pa najbolja igračica.
 * Načelo je da šira kategorija nosi veće priznanje jer je konkurencija
 * brojnija. Ako Upravni odbor odluči drukčije, mijenja se samo taj niz —
 * algoritam ostaje isti.
 */

import type { AkademijaAgeCategory } from "./categories";

export type AkademijaMedalCategory = "UKUPNO" | AkademijaAgeCategory | "ZENE";

/**
 * Prigoda u kojoj se dodjeljuju medalje. Razlikuju se po tome koje medalje
 * uopće postoje — vidi MEDAL_SLOTS.
 */
export type MedalEvent = "KVALIFIKACIJSKI" | "PRVENSTVO" | "KONACNI_POREDAK";

/**
 * Redoslijed priznanja, od najvišeg prema najnižem. Jedino mjesto na kojemu
 * je taj redoslijed zapisan.
 */
export const MEDAL_PRIORITY: AkademijaMedalCategory[] = [
  "UKUPNO",
  "U12",
  "U10",
  "U08",
  "ZENE",
];

/** Koliko se medalja dodjeljuje po kategoriji, za svaku prigodu — čl. 19. */
const MEDAL_SLOTS: Record<
  MedalEvent,
  Partial<Record<AkademijaMedalCategory, number>>
> = {
  KVALIFIKACIJSKI: { UKUPNO: 3, U12: 1, U10: 1, U08: 1, ZENE: 1 },
  // Prvenstvo Akademije nema kategorijskih medalja, pa ni prijenosa.
  PRVENSTVO: { UKUPNO: 3 },
  KONACNI_POREDAK: { UKUPNO: 3, U12: 3, U10: 3, U08: 3, ZENE: 3 },
};

/**
 * Jedan igrač u poretku iz kojega se dodjeljuju medalje.
 *
 * VAŽNO: poredak se uzima iz REDOSLIJEDA NIZA, ne iz polja `rank`. Na turniru
 * su plasmani jedinstveni (čl. 10, uz @@unique([tournamentId, rank]) u bazi),
 * ali u konačnom poretku sezone izjednačenje razrješava tie-break iz čl. 15,
 * pa je pozivatelj taj koji zna konačan redoslijed. `rank` se prenosi samo
 * radi zapisa i provjere.
 */
export interface MedalCandidate {
  playerId: string;
  rank: number;
  /** Kategorije po čl. 20 — getAkademijaAgeCategories() */
  ageCategories: AkademijaAgeCategory[];
  isFemale: boolean;
}

export interface MedalAward {
  playerId: string;
  category: AkademijaMedalCategory;
  /** 1, 2 ili 3 */
  place: number;
  /** Plasman igrača u ukupnom poretku, radi zapisa. */
  rank: number;
}

function belongsTo(
  candidate: MedalCandidate,
  category: AkademijaMedalCategory
): boolean {
  if (category === "UKUPNO") return true;
  if (category === "ZENE") return candidate.isFemale;
  return candidate.ageCategories.includes(category);
}

/**
 * Dodjeljuje medalje za jednu prigodu — čl. 19.
 *
 * Postupak: medalje se obilaze od najvišeg priznanja prema najnižem
 * (MEDAL_PRIORITY, unutar kategorije od 1. mjesta nadalje) i svaka se dodijeli
 * prvom igraču te kategorije koji još nema medalju. Time su obje rečenice
 * zadnjeg stavka zadovoljene odjednom: igrač zadržava najviše priznanje koje
 * je ostvario, a medalja koja time ostaje slobodna sama pada na sljedećeg
 * igrača te kategorije — i to opetovano, ako i on već ima medalju.
 *
 * Ako kategorija ima manje igrača nego medalja, preostale se ne dodjeljuju;
 * one se ne prenose u drugu kategoriju.
 *
 * @param ranking igrači u konačnom poretku, od prvoga prema posljednjemu
 */
export function assignMedals(
  ranking: MedalCandidate[],
  event: MedalEvent
): MedalAward[] {
  const slots = MEDAL_SLOTS[event];
  const awardedPlayers = new Set<string>();
  const awards: MedalAward[] = [];

  for (const category of MEDAL_PRIORITY) {
    const count = slots[category] ?? 0;
    if (count === 0) continue;

    let place = 1;
    for (const candidate of ranking) {
      if (place > count) break;
      if (awardedPlayers.has(candidate.playerId)) continue;
      if (!belongsTo(candidate, category)) continue;

      awards.push({
        playerId: candidate.playerId,
        category,
        place,
        rank: candidate.rank,
      });
      awardedPlayers.add(candidate.playerId);
      place += 1;
    }
  }

  return awards;
}

/** Prigoda za turnir — Prvenstvo Akademije je završni turnir (čl. 19 st. 2). */
export function medalEventForTournament(isFinal: boolean): MedalEvent {
  return isFinal ? "PRVENSTVO" : "KVALIFIKACIJSKI";
}
