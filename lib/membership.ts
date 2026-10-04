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
 *
 * Uz upisan memberSince kvačica se namjerno NE gleda: odgovor mora ovisiti o
 * datumima, inače bi naknadni ispisi iz Kluba retroaktivno mijenjali već
 * odigrane turnire (čl. 4). Da to ne znači „član zauvijek", playerSchema ne
 * dopušta skinutu kvačicu uz upisan memberSince bez memberUntil — vidi
 * lib/validation/player.ts. Promijeni li se to pravilo, ova funkcija
 * ponovno postaje rupa.
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

/**
 * Igrač nije član, ali ima upisan datum članstva — i samo zbog toga mu je
 * profil javan (vidi lib/players/profile.ts).
 *
 * Upisan datum uzima se kao dokaz da je članstvo postojalo, jer bivšem članu
 * profil treba ostati. Ali datum upisan greškom — djetetu s kvalifikacijskog
 * turnira, koje po čl. 6 nikad nije bilo član — čini isto, i to trajno. Iz
 * podatka se te dvije stvari ne mogu razlikovati, pa odluka pripada adminu:
 * ovo postojanje stanja samo iznosi na vidjelo, da se vidi ZAŠTO je profil
 * javan i da se greška može ispraviti brisanjem datuma.
 */
export function javanProfilZbogDatuma(player: MembershipFields): boolean {
  return (
    !player.isClubMember && (!!player.memberSince || !!player.memberUntil)
  );
}
