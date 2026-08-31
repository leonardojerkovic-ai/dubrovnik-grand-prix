import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — u Next.js dev modu hot-reload bi inače kreirao
 * novu instancu (i novu konekciju) na svaki spremljeni fajl. Sprema se na
 * `globalThis` da se to izbjegne.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
