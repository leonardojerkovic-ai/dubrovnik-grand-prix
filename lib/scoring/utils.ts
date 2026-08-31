/**
 * Zajedničke matematičke pomoćne funkcije za bodovni engine.
 * Koriste ih i GP i GP Akademije formule.
 */

/** Zaokružuje na zadani broj decimala (standardno zaokruživanje, half-up). */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Zaokružuje na 3 decimale — koristi se za FN i FR faktore. */
export function round3(value: number): number {
  return roundTo(value, 3);
}

/**
 * Zaokruživanje na cijeli broj gdje se 0,5 uvijek zaokružuje NA VEĆI cijeli broj
 * (čl. 5 GP pravilnika: "vrijednost od 0,5 zaokružuje se na veći cijeli broj").
 * Math.round u JS-u već radi "round half towards +Infinity" za pozitivne brojeve,
 * što je ovdje ekvivalentno, ali funkcija je eksplicitna radi čitljivosti i
 * jer GP bodovi nikad nisu negativni pa nema dvosmislenosti.
 */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Ograničava vrijednost na zadani raspon [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** log2 wrapper radi čitljivosti na mjestima gdje se koristi u formulama. */
export function log2(value: number): number {
  return Math.log2(value);
}
