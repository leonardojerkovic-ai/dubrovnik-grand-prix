/**
 * Rok za prigovor i zaključavanje rezultata — čl. 29 GP / čl. 22 Akademije.
 *
 * "Bodovi se izračunavaju i objavljuju najkasnije 7 dana nakon svakog
 *  turnira. Prigovor na izračun podnosi se voditelju u roku od 7 dana od
 *  objave. Nakon isteka roka rezultat se smatra konačnim."
 *
 * Konačan rezultat ne znači da ga je fizički nemoguće promijeniti — znači da
 * promjena više nije rutinski ispravak nego zahvat koji mora ostaviti trag i
 * obrazloženje. Zato zaključavanje nije neprobojno, nego traži izričito
 * otključavanje s razlogom, koje se zapisuje u audit log.
 */

export const OBJECTION_PERIOD_DAYS = 7;

/** Koliko dugo traje otključavanje prije nego se rezultat opet zaključa. */
export const UNLOCK_WINDOW_HOURS = 2;

export type LockState =
  /** Rezultati još nisu uneseni ni objavljeni — slobodno uređivanje. */
  | "NEOBJAVLJENO"
  /** Objavljeni, rok za prigovor još teče — ispravci su rutinski. */
  | "ROK_TECE"
  /** Rok je istekao, ali je admin privremeno otključao radi ispravka. */
  | "OTKLJUCANO"
  /** Rok je istekao — rezultat se smatra konačnim. */
  | "ZAKLJUCANO";

export interface LockInput {
  resultsPublishedAt: Date | null;
  unlockedUntil: Date | null;
}

export interface LockStatus {
  state: LockState;
  editable: boolean;
  /** Trenutak do kojeg se može uložiti prigovor; null ako nije objavljeno. */
  objectionDeadline: Date | null;
  /** Puni dani do isteka roka; 0 kad je istekao ili nije objavljeno. */
  daysRemaining: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function objectionDeadline(publishedAt: Date): Date {
  return new Date(publishedAt.getTime() + OBJECTION_PERIOD_DAYS * DAY_MS);
}

export function unlockExpiry(from: Date): Date {
  return new Date(from.getTime() + UNLOCK_WINDOW_HOURS * 60 * 60 * 1000);
}

export function getLockStatus(input: LockInput, now: Date = new Date()): LockStatus {
  const { resultsPublishedAt, unlockedUntil } = input;

  if (!resultsPublishedAt) {
    return {
      state: "NEOBJAVLJENO",
      editable: true,
      objectionDeadline: null,
      daysRemaining: 0,
    };
  }

  const deadline = objectionDeadline(resultsPublishedAt);
  const msLeft = deadline.getTime() - now.getTime();

  if (msLeft > 0) {
    return {
      state: "ROK_TECE",
      editable: true,
      objectionDeadline: deadline,
      daysRemaining: Math.ceil(msLeft / DAY_MS),
    };
  }

  if (unlockedUntil && unlockedUntil.getTime() > now.getTime()) {
    return {
      state: "OTKLJUCANO",
      editable: true,
      objectionDeadline: deadline,
      daysRemaining: 0,
    };
  }

  return {
    state: "ZAKLJUCANO",
    editable: false,
    objectionDeadline: deadline,
    daysRemaining: 0,
  };
}

/** Poruka za admina kad pokuša spremiti zaključane rezultate. */
export function lockedMessage(deadline: Date | null): string {
  const kada = deadline
    ? new Intl.DateTimeFormat("hr-HR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(deadline)
    : "nepoznato";

  return (
    `Rezultati su konačni — rok za prigovor istekao je ${kada} (čl. 29). ` +
    `Za ispravak najprije otključajte rezultate uz obrazloženje; ` +
    `otključavanje se bilježi u tragu izmjena.`
  );
}
