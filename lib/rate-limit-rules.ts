/**
 * Ograničenje broja pokušaja osjetljivih radnji.
 *
 * Štiti od dvije stvari: pogađanja lozinke u nedogled i trošenja Resendove
 * kvote tuđim zahtjevima za reset. Nije zamjena za pravi zaštitni sloj
 * ispred aplikacije, nego minimum koji stranica može sama.
 *
 * Brojanje ide preko redaka u tablici, u pomičnom prozoru, jer na Vercelu
 * svaki zahtjev može pasti na drugu instancu i brojač u memoriji ne bi
 * ništa značio.
 */
export type RateLimitRule = {
  /** Koliko pokušaja se dopušta unutar prozora. */
  limit: number;
  /** Duljina prozora u milisekundama. */
  windowMs: number;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const RATE_LIMITS = {
  /**
   * Pogađanje lozinke. Član koji je zaboravio lozinku stane u pet pokušaja.
   *
   * Broji se po paru adresa + IP, ne po samoj adresi. Dok se brojalo samo po
   * adresi, tko zna tuđu adresu e-pošte mogao je s osam krivih lozinki
   * svakih 15 minuta trajno držati vlasnika izvan računa. Ovako napadačev
   * IP troši svoju kvotu, a vlasnikov je netaknut.
   */
  prijava: { limit: 8, windowMs: 15 * MINUTE },
  /**
   * Isti IP koji pogađa po mnogo različitih računa. Par adresa + IP toga ne
   * vidi jer svaka adresa ima svoju kvotu, pa ovo stoji iznad njega. Granica
   * je namjerno visoka: iza jednog IP-a može biti cijela dvorana na istom
   * wi-fiju.
   */
  prijavaIp: { limit: 30, windowMs: 15 * MINUTE },
  /**
   * Jedan račun napadan s mnogo različitih IP adresa. Par adresa + IP toga
   * ne vidi jer je svaki par nov, a ni brojač po stroju jer je svaki stroj
   * nov.
   *
   * OVO JE PRAG ZA ZAPIS, NE GRANICA. Prijava se ne odbija kad se dosegne,
   * nego se u log upiše upozorenje (lib/auth.ts).
   *
   * Zašto ne blokira: dok je blokirao, par je dopuštao 32 pokušaja na sat s
   * jednog stroja, pa su DVIJE adrese bile dovoljne da se tuđi račun drži
   * zaključanim. Svaka granica po računu je po svojoj prirodi i način da se
   * račun zaključa. Odlučeno je da je zaključavanje vlasnika veći stvarni
   * rizik za ovu stranicu nego raspršeno pogađanje.
   *
   * Što to košta, bez uljepšavanja: raspršeno pogađanje jednog računa sada
   * nema gornju među. Svaka nova adresa donosi još 32 pokušaja na sat; sto
   * adresa je oko 3 200 na sat. Lozinka od 8 znakova s popisa čestih pada
   * brzo. Zapis pomaže samo ako ga netko čita.
   *
   * Prag 50 je ostao jer ga vlasnik s jednog stroja ne može dosegnuti (par
   * ga zaustavi na 32), pa prelazak znači da pokušaji stižu s barem dvije
   * adrese. Ako se blokada ikad vrati, pravo rješenje je kolačić poznatog
   * uređaja: pokušaji s njim ne idu kroz ovaj brojač, pa napadač ne može
   * zaključati vlasnika na njegovim strojevima.
   */
  prijavaRacun: { limit: 50, windowMs: HOUR },
  /** Svaki zahtjev troši jedan e-mail iz Resendove kvote. */
  resetLozinke: { limit: 4, windowMs: HOUR },
  /** Registracija je rijetka radnja; ovo je zaštita od masovnog upisa. */
  registracija: { limit: 6, windowMs: HOUR },
} satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Najdulji prozor od svih pravila. Zapis stariji od ovoga više ne broji
 * nijedan brojač i smije se obrisati, bez obzira na ključ.
 */
export const NAJDULJI_PROZOR_MS = Math.max(
  ...Object.values(RATE_LIMITS).map((r) => r.windowMs),
);

/**
 * Ključ po kojem se broji pokušaj prijave: adresa e-pošte i IP zajedno.
 *
 * Ako IP nije poznat (zahtjev bez zaglavlja posrednika), umjesto njega ide
 * "nepoznato" — tada se ponaša kao i prije, dakle po samoj adresi. Bolje
 * zajednička kvota nego nikakva.
 */
export function kljucPrijave(email: string, ip: string): string {
  const adresa = email.trim().toLowerCase();
  const stroj = ip.trim() === "" ? "nepoznato" : ip.trim();
  return `${adresa}|${stroj}`;
}

/** Oznaka koja stoji umjesto IP-a kad se adresa nije mogla pročitati. */
export const ADRESA_NEPOZNATA = "nepoznato";

/**
 * IP klijenta iz zaglavlja posrednika.
 *
 * Na Vercelu je x-forwarded-for lanac posrednika; prvi član je klijent.
 * Zaglavlje može biti lažirano, ali iza Vercela ga on sam prepisuje, pa je
 * prvi član onaj do kojeg je zahtjev stvarno došao.
 */
export function izvuciAdresu(
  forwardedFor: string | null,
  realIp: string | null = null,
): string {
  const prvi = (forwardedFor ?? "").split(",")[0]?.trim() ?? "";
  if (prvi !== "") return prvi;
  const rezerva = (realIp ?? "").trim();
  return rezerva === "" ? ADRESA_NEPOZNATA : rezerva;
}

/**
 * IP iz zaglavlja koja NextAuth predaje u authorize(credentials, req).
 *
 * Tamo su zaglavlja obično objekt, a ne Headers, i vrijednost može biti i
 * niz. Vraća null kad se adresa ne može pročitati — pozivatelj tada zna da
 * nema IP-a, umjesto da svi neprepoznati dijele jedan brojač.
 */
export function adresaIzZaglavlja(
  zaglavlja: Record<string, string | string[] | undefined> | undefined,
): string | null {
  if (!zaglavlja) return null;
  const jedno = (ime: string): string | null => {
    const v = zaglavlja[ime];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const adresa = izvuciAdresu(jedno("x-forwarded-for"), jedno("x-real-ip"));
  return adresa === ADRESA_NEPOZNATA ? null : adresa;
}

export type RateLimitResult = {
  allowed: boolean;
  /** Koliko je pokušaja još preostalo u prozoru. */
  remaining: number;
  /** Kad prozor istječe; postoji samo kad je pokušaj odbijen. */
  retryAt?: Date;
};

/**
 * Poruka koju obrazac pokazuje kad je granica dosegnuta.
 *
 * Namjerno ne otkriva je li adresa u sustavu ni koliko je pokušaja bilo —
 * kaže samo kad se smije pokušati ponovno.
 */
export function rateLimitMessage(retryAt?: Date, now: Date = new Date()): string {
  if (!retryAt) return "Previše pokušaja. Pokušaj kasnije.";
  const minutes = Math.max(1, Math.ceil((retryAt.getTime() - now.getTime()) / MINUTE));
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return `Previše pokušaja. Pokušaj ponovno za ${hours === 1 ? "sat vremena" : `${hours} sata`}.`;
  }
  return `Previše pokušaja. Pokušaj ponovno za ${minutes === 1 ? "minutu" : `${minutes} min`}.`;
}
