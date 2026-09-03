import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getManagedPlayers } from "@/lib/guardian";

/**
 * Igrači kojima korisnik upravlja i njihove prijave na turnire.
 *
 * Postoji zato što su javne stranice u predmemoriji (revalidate = 60).
 * Kad bi se stanje prijave prikazivalo iz poslužiteljskog prikaza, prvi
 * posjetitelj bi svoje stanje "zamrznuo" za sve ostale.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const players = await getManagedPlayers();

  if (players.length === 0) {
    return NextResponse.json(
      { players: [], registrations: {} },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const rows = await prisma.tournamentRegistration.findMany({
    where: {
      playerId: { in: players.map((p) => p.id) },
      status: "PRIJAVLJEN",
    },
    select: { tournamentId: true, playerId: true },
  });

  const registrations: Record<string, string[]> = {};
  for (const r of rows) {
    (registrations[r.tournamentId] ??= []).push(r.playerId);
  }

  return NextResponse.json(
    {
      players: players.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        isSelf: p.isSelf,
      })),
      registrations,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
