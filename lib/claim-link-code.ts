import type { Prisma } from "@prisma/client";

/**
 * Zauzima igrački profil pristupnim kodom — jednom i samo jednom.
 *
 * Provjera „je li kod već iskorišten" i sam upis prije su bili dva odvojena
 * koraka. Između njih stane drugi zahtjev: dva istovremena slanja istog koda
 * oba prođu provjeru i oba se povežu, pa jedan profil dobije dva skrbnika
 * ili se iskorišten kod upotrijebi drugi put.
 *
 * Ovdje uvjet stoji u samom UPDATE-u, pa ga izvršava baza nad zaključanim
 * retkom. Tko stigne drugi, ne zatekne više nijedan redak koji odgovara
 * uvjetu i dobije `false`.
 *
 * Provjera prije poziva i dalje ima smisla — služi porukama i provjeri dobi
 * — ali više nije ono na što se oslanja ispravnost.
 */
export async function claimPlayerByLinkCode(
  tx: Prisma.TransactionClient,
  playerId: string,
  data: { userId?: string } = {}
): Promise<boolean> {
  const { count } = await tx.player.updateMany({
    where: { id: playerId, userId: null, linkCodeUsedAt: null },
    data: { ...data, linkCodeUsedAt: new Date() },
  });
  return count === 1;
}
