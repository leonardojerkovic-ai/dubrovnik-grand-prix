import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export { isMinorByBirthYear } from "./guardian-rules";

export interface ManagedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  /** true = vlastiti profil vlasnika računa, false = dijete pod skrbništvom. */
  isSelf: boolean;
}

/**
 * Igrači kojima prijavljeni korisnik smije upravljati: vlastiti profil i
 * djeca pod skrbništvom. Vlastiti profil je uvijek prvi.
 */
export async function getManagedPlayers(): Promise<ManagedPlayer[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return [];

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      player: {
        select: { id: true, firstName: true, lastName: true, birthYear: true },
      },
      guardianOf: {
        select: {
          player: {
            select: { id: true, firstName: true, lastName: true, birthYear: true },
          },
        },
        orderBy: { player: { firstName: "asc" } },
      },
    },
  });

  if (!user) return [];

  const out: ManagedPlayer[] = [];
  if (user.player) out.push({ ...user.player, isSelf: true });
  for (const g of user.guardianOf) {
    out.push({ ...g.player, isSelf: false });
  }
  return out;
}

/** Smije li prijavljeni korisnik djelovati u ime zadanog igrača. */
export async function canActFor(playerId: string): Promise<boolean> {
  const managed = await getManagedPlayers();
  return managed.some((p) => p.id === playerId);
}
