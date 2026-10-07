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

  /*
    Brojanje i upis moraju biti jedna nedjeljiva radnja.

    Prije su bili dva odvojena upita — prvo findMany, pa create — pa je
    osam istodobnih zahtjeva moglo svih osam proći kroz provjeru prije nego
    je ijedan upisao svoj redak. Upravo tako izgleda pogađanje lozinke
    skriptom: zahtjevi ne dolaze jedan po jedan.

    Transakcija sama ne bi bila dovoljna, jer pod READ COMMITTED svaka vidi
    svoj snimak. Savjetodavno zaključavanje po ključu (pg_advisory_xact_lock)
    propušta po jedan zahtjev za isti bucket; drugi ključevi se ne čekaju.
    Zaključavanje traje do kraja transakcije, dakle milisekunde.

    hashtext može dati isti broj za dva različita ključa. Posljedica je samo
    da ta dva ključa čekaju jedan drugoga — brojke ostaju odvojene jer se
    broji po bucketu, ne po bravi.
  */
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bucket}))`;

    const recent = await tx.rateLimitHit.findMany({
      where: { bucket, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (recent.length >= rule.limit) {
      const oldest = recent[0]!.createdAt;
      // Odbijeni pokušaj se NE upisuje. Da se upisuje, onaj tko pogađa
      // lozinku držao bi prozor otvorenim zauvijek i vlasnik računa se više
      // nikad ne bi mogao prijaviti.
      return {
        allowed: false,
        remaining: 0,
        retryAt: new Date(oldest.getTime() + rule.windowMs),
      };
    }

    await tx.rateLimitHit.create({ data: { bucket, createdAt: now } });

    // Čišćenje usput: bez ovoga tablica raste zauvijek. Briše se samo ono što
    // je ispalo iz prozora ovog istog ključa, pa je upit jeftin.
    await tx.rateLimitHit.deleteMany({
      where: { bucket, createdAt: { lt: since } },
    });

    return { allowed: true, remaining: rule.limit - recent.length - 1 };
  });
}
