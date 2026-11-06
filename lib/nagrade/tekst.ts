/**
 * Normalizacija teksta za uspoređivanje: bez dijakritike, bez razlike
 * velikih i malih slova, bez višestrukih razmaka.
 *
 * Stoji u zasebnoj datoteci jer je trebaju i čitanje poretka (`unos.ts`,
 * za prepoznavanje kluba) i dodjela (`dodjela.ts`, za skupine). Da je
 * ostala u jednoj od njih, druga bi je uvozila iz prve i nastao bi kružni
 * uvoz — `unos.ts` već uvozi tip iz `dodjela.ts`.
 */
export function zaUsporedbu(tekst: string): string {
  return tekst
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
