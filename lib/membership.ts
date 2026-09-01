/**
 * Članstvo u ŠK Dubrovnik na određeni dan — čl. 4 oba pravilnika.
 *
 * "Članom ŠK Dubrovnik smatra se igrač koji je na dan početka turnira bio
 * upisan u članstvo Kluba. Naknadno učlanjenje ne primjenjuje se retroaktivno
 * na već odigrane turnire."
 *
 * Zato se članstvo za potrebe ljestvica NIKAD ne čita iz trenutnog stanja
 * (Player.isClubMember), nego iz zapisa po rezultatu.
 */

export interface MembershipFields {
  isClubMember: boolean;
  memberSince: Date | null;
  memberUntil: Date | null;
}

/** Normalizira na početak dana — turnir počinje danom, ne satom. */
function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Je li igrač bio član na zadani dan.
 *
 * Ako memberSince nije upisan, ne može se tvrditi da je članstvo postojalo
 * na neki raniji datum, pa se pada natrag na trenutno stanje. To je jedini
 * slučaj u kojemu rezultat ovisi o sadašnjosti — vidi needsMembershipDate().
 */
export function wasClubMemberOn(
  player: MembershipFields,
  date: Date
): boolean {
  const day = startOfDay(date);

  if (!player.memberSince) {
    return player.isClubMember;
  }

  if (startOfDay(player.memberSince) > day) return false;
  if (player.memberUntil && startOfDay(player.memberUntil) < day) return false;

  return true;
}

/**
 * Igrač je označen kao član, ali nema upisan datum učlanjenja — članstvo za
 * ranije turnire tada nije provjerljivo. Admin bi trebao dopuniti podatak.
 */
export function needsMembershipDate(player: MembershipFields): boolean {
  return player.isClubMember && !player.memberSince;
}
