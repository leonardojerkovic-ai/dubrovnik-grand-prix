import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPlayer } from "@/lib/current-player";

/**
 * Turniri na koje je prijavljen trenutni korisnik.
 *
 * Postoji zato što su javne stranice u predmemoriji (revalidate = 60).
 * Kad bi se stanje prijave prikazivalo iz poslužiteljskog prikaza, prvi
 * posjetitelj bi svoje stanje "zamrznuo" za sve ostale — netko bi vidio
 * "Odjavi se" na turniru na koji se nikad nije prijavio.
 *
 * Zato stranice ostaju statične, a ovaj odgovor je uvijek svjež i vezan uz
 * prijavljenog korisnika.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json(
      { tournamentIds: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: { playerId: player.id, status: "PRIJAVLJEN" },
    select: { tournamentId: true },
  });

  return NextResponse.json(
    { tournamentIds: registrations.map((r) => r.tournamentId) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
