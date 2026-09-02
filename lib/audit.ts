import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@/lib/require-admin";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RECALCULATE";

export interface AuditActor {
  email: string;
  role: AdminRole;
}

interface LogAuditInput {
  actor: AuditActor;
  action: AuditAction;
  /** Naziv modela: "Player", "Tournament", "Season", ... */
  entity: string;
  entityId?: string | null;
  /** Kratak opis na hrvatskom — ono što admin vidi u pregledu. */
  summary: string;
  before?: unknown;
  after?: unknown;
}

/** Polja koja nikad ne smiju završiti u tragu. */
const REDACTED_KEYS = new Set([
  "passwordHash",
  "password",
  "token",
  "resetToken",
]);

/**
 * Priprema objekt za zapis: uklanja osjetljiva polja i pretvara datume u
 * tekst, jer Json stupac ne zna serijalizirati Date.
 */
function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;

  const seen = new WeakSet<object>();

  const walk = (v: unknown): unknown => {
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return "[kružna referenca]";
      seen.add(v as object);
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (REDACTED_KEYS.has(k)) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };

  return walk(value) as Prisma.InputJsonValue;
}

/**
 * Zapisuje trag o izvršenoj radnji.
 *
 * NAMJERNO ne baca iznimku: audit trag je važan, ali nije važniji od same
 * radnje. Ako zapisivanje padne, radnja koja je već izvršena ne smije se
 * zbog toga prikazati kao neuspjela. Greška ide u log poslužitelja.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: input.actor.email,
        actorRole: input.actor.role,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary,
        before: sanitize(input.before),
        after: sanitize(input.after),
      },
    });
  } catch (err) {
    console.error("[audit] zapisivanje traga nije uspjelo:", err);
  }
}
