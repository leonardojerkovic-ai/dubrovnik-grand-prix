import { revalidatePath } from "next/cache";

/**
 * Osvježavanje predmemorije javnih stranica nakon izmjena u adminu.
 *
 * Next.js javne stranice poslužuje iz predmemorije. Admin akcije su dosad
 * osvježavale samo admin putanje, pa se novi turnir nije pojavljivao na
 * naslovnici ni u kalendaru, a spremljeni rezultati nisu mijenjali javnu
 * ljestvicu — sve do sljedeće izgradnje.
 *
 * Uz ovo, javne stranice imaju i vremensko osvježavanje (vidi `revalidate`
 * u samim stranicama). To je mreža ispod ove mjere, za slučaj da se negdje
 * zaboravi dodati putanja ili da se podatak promijeni mimo aplikacije —
 * primjerice uvozom FIDE rejtinga iz GitHub Actionsa, koji o Vercelovoj
 * predmemoriji ne zna ništa.
 */

/** Stranice koje ovise o kalendaru i sezonama. */
export function revalidateSchedule(tournamentId?: string): void {
  revalidatePath("/");
  revalidatePath("/kalendar");
  revalidatePath("/najave");
  revalidatePath("/prijave");
  if (tournamentId) {
    revalidatePath(`/turniri/${tournamentId}`);
  }
}

/** Stranice koje ovise o rezultatima i bodovima. */
export function revalidateStandings(tournamentId?: string): void {
  revalidatePath("/");
  revalidatePath("/ljestvice", "layout");
  revalidatePath("/igraci", "layout");
  if (tournamentId) {
    revalidatePath(`/turniri/${tournamentId}`);
  }
}

/** Stranice koje ovise o podacima o igračima. */
export function revalidatePlayers(playerId?: string): void {
  revalidatePath("/igraci");
  revalidatePath("/ljestvice", "layout");
  if (playerId) {
    revalidatePath(`/igraci/${playerId}`);
  }
}
