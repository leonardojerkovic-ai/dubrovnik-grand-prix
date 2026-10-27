/**
 * Kvota prijava i lista čekanja — čiste odluke, bez Prisme.
 *
 * Turnir može imati ograničen broj mjesta (`maxPlayers`). Dok ih ima,
 * prijava je potvrđena; kad se popune, nove idu na listu čekanja i odatle
 * upadaju kad se netko odjavi. Odluke su ovdje izdvojene da se mogu
 * testirati bez baze; sve što traži bravu i transakciju je u
 * ./lista-cekanja.ts.
 *
 * Prazna kvota (`null`) znači bez ograničenja — tako je bilo prije ove
 * mogućnosti i tako ostaje za sve postojeće turnire.
 */

export type StatusPrijave = "PRIJAVLJEN" | "NA_CEKANJU";

/** Ima li još slobodnih mjesta. */
export function imaMjesta(
  brojPrijavljenih: number,
  maxPlayers: number | null | undefined
): boolean {
  if (maxPlayers === null || maxPlayers === undefined) return true;
  return brojPrijavljenih < maxPlayers;
}

/** S kojim statusom ulazi nova prijava. */
export function statusNovePrijave(
  brojPrijavljenih: number,
  maxPlayers: number | null | undefined
): StatusPrijave {
  return imaMjesta(brojPrijavljenih, maxPlayers) ? "PRIJAVLJEN" : "NA_CEKANJU";
}

/**
 * Koliko ih se s liste čekanja može promaknuti.
 *
 * Nikad više nego što ih na listi ima i nikad više nego što stane. Kad je
 * kvota snižena ispod broja već prijavljenih, razlika je negativna i vraća
 * se nula — nikoga se ne izbacuje, samo nema novih dok se ne isprazni.
 * Oduzeti nekome potvrđeno mjesto gore je od prekoračenja kvote.
 */
export function kolikoPromaknuti(
  brojPrijavljenih: number,
  brojNaCekanju: number,
  maxPlayers: number | null | undefined
): number {
  if (brojNaCekanju <= 0) return 0;
  if (maxPlayers === null || maxPlayers === undefined) return brojNaCekanju;
  const slobodno = maxPlayers - brojPrijavljenih;
  if (slobodno <= 0) return 0;
  return Math.min(slobodno, brojNaCekanju);
}

/**
 * Promiče li se itko kad se odjavi igrač u danom statusu.
 *
 * Odjava nekoga tko je i sam bio na čekanju ne oslobađa mjesto, pa nikoga
 * ne pomiče naprijed.
 */
export function odjavaOslobadaMjesto(status: string): boolean {
  return status === "PRIJAVLJEN";
}
