import type { Title } from "@prisma/client";

/**
 * Koja se titula pokazuje uz rezultat odigranog turnira.
 *
 * Zapisana (`titleSnapshotUsed`) ima prednost: ona je titula iz trenutka
 * spremanja rezultata, pa tablica turnira iz 2027. ne pokazuje napredovanje
 * iz 2028.
 *
 * Prazno znači da je turnir spremljen prije uvođenja tog polja. Tada se pada
 * na igračevu trenutnu titulu — isto što se prikazivalo i dosad, pa stare
 * tablice ne dobivaju prazne ćelije.
 *
 * `NONE` je vrijednost, ne praznina: igrač bez titule zapisan je kao NONE i
 * to se ne smije zamijeniti s „nije zapisano", inače bi mu se prikazala
 * današnja titula iako je tada bio bez nje.
 */
export function prikazanaTitula(
  zapisana: Title | null | undefined,
  trenutna: Title
): Title {
  return zapisana ?? trenutna;
}
