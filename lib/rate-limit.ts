import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, type RateLimitAction, type RateLimitResult } from "@/lib/rate-limit-rules";

// Pravila i poruka stoje odvojeno, u rate-limit-rules.ts, da ih se može
// testirati bez povlačenja Prisma klijenta.
export * from "@/lib/rate-limit-rules";

/**
 * Zabilježi pokušaj i javi smije li se nastaviti.
 *
 * `identifier` je ono po čemu se broji — adresa e-pošte ili IP. Poziva se
 * PRIJE same radnje, jer i neuspjeli pokušaj mora ulaziti u brojku.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
  now: Date = new Date()
): Promise<RateLimitResult> {
  const rule = RATE_LIMITS[action];
  const bucket = `${action}:${identifier.trim().toLowerCase()}`;
  const since = new Date(now.getTime() - rule.windowMs);

  const recent = await prisma.rateLimitHit.findMany({
    where: { bucket, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (recent.length >= rule.limit) {
    const oldest = recent[0]!.createdAt;
    return {
      allowed: false,
      remaining: 0,
      retryAt: new Date(oldest.getTime() + rule.windowMs),
    };
  }

  await prisma.rateLimitHit.create({ data: { bucket, createdAt: now } });

  // Čišćenje usput: bez ovoga tablica raste zauvijek. Briše se samo ono što
  // je ispalo iz prozora ovog istog ključa, pa je upit jeftin.
  await prisma.rateLimitHit.deleteMany({
    where: { bucket, createdAt: { lt: since } },
  });

  return { allowed: true, remaining: rule.limit - recent.length - 1 };
}
