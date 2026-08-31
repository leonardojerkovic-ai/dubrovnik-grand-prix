import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Vraća Player zapis povezan s trenutno prijavljenim korisnikom, ili null. */
export async function getCurrentPlayer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { player: true },
  });

  return user?.player ?? null;
}
