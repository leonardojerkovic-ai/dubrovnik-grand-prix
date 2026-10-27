import { prisma } from "@/lib/prisma";
import { sqlLockTimeout, TRANSAKCIJA_BRAVE } from "@/lib/rate-limit-rules";
import { kolikoPromaknuti, statusNovePrijave, type StatusPrijave } from "./kvota";

/**
 * Upis prijave i promicanje s liste čekanja — sve što traži bravu i
 * transakciju. Same odluke su u ./kvota.ts, bez Prisme, i tamo su testirane.
 *
 * ZAŠTO BRAVA. Bez nje dvije istodobne prijave na zadnje slobodno mjesto
 * obje pročitaju isti broj prijavljenih i obje prođu. Turnir tada ima
 * jednog igrača viška, a to se otkrije tek na dan turnira, kad nema
 * ploče. Isti razlog i isti obrazac kao kod brojača prijava
 * (lib/rate-limit.ts): `SET LOCAL lock_timeout` kao prva naredba, pa
 * `pg_advisory_xact_lock`.
 *
 * Brava je po turniru, ne globalna — prijave na dva turnira ne čekaju
 * jedna drugu.
 */
function kljucBrave(tournamentId: string): string {
  return `prijave:${tournamentId}`;
}

export interface IshodPrijave {
  status: StatusPrijave;
  /** Mjesto u redu čekanja (1 = prvi na redu); null kad je prijava potvrđena. */
  mjestoUReduCekanja: number | null;
}

/**
 * Upisuje prijavu i vraća je li potvrđena ili je otišla na čekanje.
 *
 * Ponovna prijava igrača koji je ranije otkazao vraća ga u red po
 * današnjem trenutku, ne po prvotnom — inače bi otkazivanje i ponovna
 * prijava bili način da se preskoči red.
 */
export async function prijaviSKvotom(
  tournamentId: string,
  playerId: string
): Promise<IshodPrijave> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(sqlLockTimeout());
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${kljucBrave(tournamentId)}))`;

      const turnir = await tx.tournament.findUnique({
        where: { id: tournamentId },
        select: { maxPlayers: true },
      });

      const brojPrijavljenih = await tx.tournamentRegistration.count({
        where: { tournamentId, status: "PRIJAVLJEN" },
      });

      const status = statusNovePrijave(brojPrijavljenih, turnir?.maxPlayers);

      // Jedan trenutak za upis i za brojanje reda, da red ne ovisi o tome
      // koliko je milisekundi prošlo između dva poziva unutar transakcije.
      const sada = new Date();

      await tx.tournamentRegistration.upsert({
        where: { tournamentId_playerId: { tournamentId, playerId } },
        create: { tournamentId, playerId, status, registeredAt: sada },
        update: { status, registeredAt: sada },
      });

      if (status === "PRIJAVLJEN") {
        return { status, mjestoUReduCekanja: null };
      }

      const ispredNjega = await tx.tournamentRegistration.count({
        where: {
          tournamentId,
          status: "NA_CEKANJU",
          registeredAt: { lt: sada },
        },
      });

      return { status, mjestoUReduCekanja: ispredNjega + 1 };
    },
    { maxWait: TRANSAKCIJA_BRAVE.maxWait, timeout: TRANSAKCIJA_BRAVE.timeout }
  );
}

/** Igrač promaknut s liste čekanja — koliko treba da mu se javi. */
export interface Promaknut {
  playerId: string;
  ime: string;
}

/**
 * Promiče s liste čekanja koliko ih stane i vraća koga je promaknula.
 *
 * Zove se nakon svake odjave potvrđenog igrača i nakon povišenja kvote.
 * Kad nema kvote ili nema nikoga na listi, ne radi ništa i vraća prazno,
 * pa je sigurno zvati je bezuvjetno.
 *
 * Obavijest e-poštom NIJE ovdje: slanje ne smije biti unutar transakcije
 * koja drži bravu, jer bi svaki zastoj poštanskog servisa zaustavio
 * prijave na tom turniru. Pozivatelj šalje nakon što transakcija prođe.
 */
export async function promakniSListeCekanja(
  tournamentId: string
): Promise<Promaknut[]> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(sqlLockTimeout());
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${kljucBrave(tournamentId)}))`;

      const turnir = await tx.tournament.findUnique({
        where: { id: tournamentId },
        select: { maxPlayers: true, status: true },
      });
      if (!turnir) return [];

      // Lista radi dok su prijave otvorene. Turnir u tijeku ili završen
      // ima izvučene parove, pa bi naknadni ulazak s liste značio igrača
      // koji nije za stolom.
      if (turnir.status === "U_TIJEKU" || turnir.status === "ZAVRSEN") return [];

      const [brojPrijavljenih, naCekanju] = await Promise.all([
        tx.tournamentRegistration.count({
          where: { tournamentId, status: "PRIJAVLJEN" },
        }),
        tx.tournamentRegistration.findMany({
          where: { tournamentId, status: "NA_CEKANJU" },
          orderBy: { registeredAt: "asc" },
          select: {
            id: true,
            playerId: true,
            player: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      const koliko = kolikoPromaknuti(
        brojPrijavljenih,
        naCekanju.length,
        turnir.maxPlayers
      );
      if (koliko === 0) return [];

      const biraniRedom = naCekanju.slice(0, koliko);

      await tx.tournamentRegistration.updateMany({
        where: { id: { in: biraniRedom.map((r) => r.id) } },
        data: { status: "PRIJAVLJEN" },
      });

      return biraniRedom.map((r) => ({
        playerId: r.playerId,
        ime: `${r.player.firstName} ${r.player.lastName}`,
      }));
    },
    { maxWait: TRANSAKCIJA_BRAVE.maxWait, timeout: TRANSAKCIJA_BRAVE.timeout }
  );
}
