/**
 * Parser službene FIDE rating liste (TXT format).
 *
 * FIDE objavljuje datoteke fiksne širine stupaca, s jednim retkom zaglavlja.
 * Širine stupaca povremeno se mijenjaju, pa se NE zakucavaju — izvode se iz
 * zaglavlja pri svakom uvozu. Ako se zaglavlje ne može pročitati, uvoz staje
 * s greškom umjesto da upiše krivo poravnate brojeve u bazu.
 *
 * Izvor: https://ratings.fide.com/download_lists.phtml
 */

export type FideRatingType = "STANDARD" | "RAPID" | "BLITZ";

/**
 * U zasebnim listama (standard/rapid/blitz) stupac s rejtingom nosi oznaku
 * mjeseca liste, npr. "SEP26" ili "JAN27" — mijenja se svakog mjeseca, pa se
 * traži uzorkom, a ne imenom.
 */
const MONTH_COLUMN =
  /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\b/i;

/** Nazivi stupca s rejtingom u pojedinoj listi, redom kako ih FIDE piše. */
const RATING_COLUMN_MATCHERS: Record<FideRatingType, (string | RegExp)[]> = {
  // Kombinirana lista ima sva tri stupca imenovana; zasebne liste imaju
  // jedan stupac s oznakom mjeseca. Imenovani se traže prvi.
  STANDARD: ["SRtng", "SRTNG", MONTH_COLUMN, "Rtng", "RTNG"],
  RAPID: ["RRtng", "RRTNG", MONTH_COLUMN, "Rtng", "RTNG"],
  BLITZ: ["BRtng", "BRTNG", MONTH_COLUMN, "Rtng", "RTNG"],
};

const ID_COLUMN_ALIASES = ["ID Number", "IDNumber", "ID_NUMBER", "ID"];


export interface ColumnLayout {
  idStart: number;
  idEnd: number;
  ratingStart: number;
  ratingEnd: number;
}

export interface FideRecord {
  fideId: string;
  rating: number | null;
}

/**
 * Nalazi granice stupca u zaglavlju fiksne širine.
 * Stupac počinje na poziciji naslova, a završava na početku sljedećeg naslova.
 */
function findColumn(
  header: string,
  matchers: (string | RegExp)[]
): { start: number; end: number } | null {
  for (const matcher of matchers) {
    let start: number;
    let alias: string;

    if (typeof matcher === "string") {
      start = header.indexOf(matcher);
      alias = matcher;
    } else {
      const m = header.match(matcher);
      start = m?.index ?? -1;
      alias = m?.[0] ?? "";
    }

    if (start === -1) continue;

    // Kraj = početak sljedeće riječi nakon razmaka, ili kraj retka.
    const after = header.slice(start + alias.length);
    const gap = after.match(/^\s+/);
    if (!gap) return { start, end: start + alias.length };

    const nextWord = after.slice(gap[0].length);
    const end =
      nextWord.length === 0
        ? header.length
        : start + alias.length + gap[0].length;
    return { start, end };
  }
  return null;
}

/** Izvodi raspored stupaca iz retka zaglavlja. Baca ako zaglavlje ne odgovara. */
export function parseHeader(
  header: string,
  type: FideRatingType
): ColumnLayout {
  const id = findColumn(header, ID_COLUMN_ALIASES);
  const rating = findColumn(header, RATING_COLUMN_MATCHERS[type]);

  if (!id || !rating) {
    throw new Error(
      `Zaglavlje FIDE liste nije prepoznato (traženo: ID i rejting za ${type}). ` +
        `Format se vjerojatno promijenio — provjerite ratings.fide.com prije nego nastavite. ` +
        `Zaglavlje: "${header.slice(0, 200)}"`
    );
  }

  return {
    idStart: id.start,
    idEnd: id.end,
    ratingStart: rating.start,
    ratingEnd: rating.end,
  };
}

/** Najmanji i najveći rejting koji se smatra vjerodostojnim. */
export const MIN_PLAUSIBLE_RATING = 1000;
export const MAX_PLAUSIBLE_RATING = 3600;

/**
 * Vraća cijeli broj koji se nalazi u zadanom rasponu, ili prazan tekst.
 *
 * Stupci zaglavlja i podataka znaju se razminuti za koji znak. Naivno
 * izrezivanje pretvorilo bi rejting 2287 u 22 i takav bi tiho završio u bazi
 * — greška koju nitko ne primijeti dok ne pogleda profil. Zato se traži
 * PRVA znamenka unutar raspona, pa se taj broj proširi do kraja u oba
 * smjera. Susjedni stupci su odvojeni razmakom, pa širenje ne može zahvatiti
 * dva broja odjednom.
 */
function sliceNumber(line: string, start: number, end: number): string {
  const from = Math.max(0, start);
  const to = Math.min(line.length, end);

  let i = -1;
  for (let k = from; k < to; k++) {
    if (/\d/.test(line[k]!)) {
      i = k;
      break;
    }
  }
  if (i === -1) return "";

  let a = i;
  let b = i + 1;
  while (a > 0 && /\d/.test(line[a - 1]!)) a--;
  while (b < line.length && /\d/.test(line[b]!)) b++;

  return line.slice(a, b);
}

/**
 * Čita jedan redak podataka. Vraća null za prazne retke i za retke koji
 * nemaju valjan FIDE ID — u listi se povremeno pojave nepotpuni zapisi.
 *
 * Baca ako je rejting izvan vjerodostojnog raspona: to gotovo uvijek znači
 * da je format datoteke drukčiji nego što zaglavlje sugerira, a tiho
 * upisivanje krivih brojeva bilo bi gore od prekida uvoza.
 */
export function parseLine(
  line: string,
  layout: ColumnLayout
): FideRecord | null {
  if (line.trim().length === 0) return null;

  const fideId = sliceNumber(line, layout.idStart, layout.idEnd);
  if (!/^\d+$/.test(fideId)) return null;

  const raw = sliceNumber(line, layout.ratingStart, layout.ratingEnd);

  // Prazno polje ili nula = igrač nije ocijenjen u tom tempu.
  if (raw.length === 0 || raw === "0") return { fideId, rating: null };
  if (!/^\d+$/.test(raw)) return { fideId, rating: null };

  const rating = Number(raw);
  if (rating < MIN_PLAUSIBLE_RATING || rating > MAX_PLAUSIBLE_RATING) {
    throw new Error(
      `Pročitan rejting ${rating} za FIDE ID ${fideId} izvan je raspona ` +
        `${MIN_PLAUSIBLE_RATING}–${MAX_PLAUSIBLE_RATING}. Stupci se vjerojatno ` +
        `ne poklapaju sa zaglavljem — uvoz je prekinut da se ne upišu krivi podaci.`
    );
  }

  return { fideId, rating };
}

/**
 * Prolazi kroz retke i vraća samo tražene igrače.
 * Lista ima preko milijun redaka, a klubu treba njih nekoliko desetaka.
 */
export function extractPlayers(
  lines: Iterable<string>,
  wantedFideIds: Set<string>,
  type: FideRatingType
): Map<string, number | null> {
  const found = new Map<string, number | null>();
  let layout: ColumnLayout | null = null;

  for (const line of lines) {
    if (!layout) {
      // Prvi neprazan redak je zaglavlje.
      if (line.trim().length === 0) continue;
      layout = parseHeader(line, type);
      continue;
    }

    const record = parseLine(line, layout);
    if (!record) continue;
    if (!wantedFideIds.has(record.fideId)) continue;

    found.set(record.fideId, record.rating);
    // Kad su svi pronađeni, nema smisla čitati ostatak liste.
    if (found.size === wantedFideIds.size) break;
  }

  if (!layout) {
    throw new Error("FIDE lista je prazna — nije pronađeno zaglavlje.");
  }

  return found;
}

/** URL službene mjesečne liste za zadani tempo. */
export function ratingListUrl(type: FideRatingType): string {
  const file = {
    STANDARD: "standard_rating_list.zip",
    RAPID: "rapid_rating_list.zip",
    BLITZ: "blitz_rating_list.zip",
  }[type];
  return `https://ratings.fide.com/download/${file}`;
}
