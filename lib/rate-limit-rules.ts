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
  /** Pogađanje lozinke. Član koji je zaboravio lozinku stane u pet pokušaja. */
  prijava: { limit: 8, windowMs: 15 * MINUTE },
  /** Svaki zahtjev troši jedan e-mail iz Resendove kvote. */
  resetLozinke: { limit: 4, windowMs: HOUR },
  /** Registracija je rijetka radnja; ovo je zaštita od masovnog upisa. */
  registracija: { limit: 6, windowMs: HOUR },
} satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

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
