import { prisma } from "@/lib/prisma";
import { logAudit, SUSTAV } from "@/lib/audit";
import { sendWaitlistPromotedEmail } from "@/lib/email";
import type { Promaknut } from "./lista-cekanja";

/** Javna adresa stranice, za poveznicu u poruci. */
function osnovnaAdresa(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.dubrovnikgrandprix.com"
  );
}

/**
 * Bilježi promicanje i javlja promaknutima da su ušli s liste čekanja.
 *
 * Poruka ide igraču (ako njegov profil ima vezan račun) i svim njegovim
 * skrbnicima — dijete se prijavljuje preko roditeljskog računa, pa bi
 * slanje samo igraču značilo poruku koju nitko ne čita.
 *
 * Pad slanja NE SMIJE srušiti odjavu koja je promicanje izazvala: upis u
 * bazu je već obavljen i točan, a nedostavljena poruka je manja šteta od
 * odjave koja je pukla na pola. Zato se greška bilježi i ide se dalje.
 */
export async function obradiPromaknute(
  tournamentId: string,
  promaknuti: Promaknut[]
): Promise<void> {
  if (promaknuti.length === 0) return;

  // Trag izmjena ne smije ovisiti o tome tko je odjavu izazvao: promicanje
  // je uvijek radnja sustava, i kad ga pokrene igrač svojom odjavom i kad
  // admin ukloni prijavu.
  for (const osoba of promaknuti) {
    await logAudit({
      actor: SUSTAV,
      action: "UPDATE",
      entity: "TournamentRegistration",
      entityId: `${tournamentId}:${osoba.playerId}`,
      summary: `S liste čekanja ušao/la među prijavljene: ${osoba.ime}`,
      after: { status: "PRIJAVLJEN" },
    });
  }

  const turnir = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, date: true },
  });
  if (!turnir) return;

  const datum = turnir.date.toLocaleDateString("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const url = `${osnovnaAdresa()}/turniri/${tournamentId}`;

  for (const osoba of promaknuti) {
    try {
      const igrac = await prisma.player.findUnique({
        where: { id: osoba.playerId },
        select: {
          user: { select: { email: true } },
          guardians: { select: { guardian: { select: { email: true } } } },
        },
      });

      const adrese = [
        igrac?.user?.email,
        ...(igrac?.guardians.map((g) => g.guardian.email) ?? []),
      ].filter((e): e is string => typeof e === "string" && e.length > 0);

      await sendWaitlistPromotedEmail(
        Array.from(new Set(adrese)),
        osoba.ime,
        turnir.name,
        datum,
        url
      );
    } catch (greska) {
      console.error(
        "Obavijest o ulasku s liste čekanja nije poslana:",
        osoba.playerId,
        greska instanceof Error ? greska.name : typeof greska
      );
    }
  }
}
