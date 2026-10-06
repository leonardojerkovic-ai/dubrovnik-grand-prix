import { prisma } from "@/lib/prisma";

/**
 * Smije li ponovni izračun promijeniti već dodijeljene medalje i nagrade.
 *
 * "pri-unosu" — izračun ide iz spremanja rezultata. Ako dodjela već postoji,
 * ona je ono što je na turniru uručeno, pa se ne dira: izračun se samo
 * usporedi i razlike se javljaju adminu. Ako dodjele još nema, prvi izračun
 * se primjenjuje — on i jest ono što će se uručiti.
 *
 * "izricito" — admin je sam pokrenuo izračun. Tada se primjenjuje bez
 * pitanja; to je svjesna odluka i stoji u auditu.
 */
export type NacinDodjele = "pri-unosu" | "izricito";

/**
 * Opis razlika između dodijeljenog i novog izračuna, s imenima igrača.
 *
 * Bez imena poruka adminu ne znači ništa — „U12/1 se promijenio" ne govori
 * koga treba pozvati i što mu reći.
 */
export async function opisiRazlikeDodjele(
  dodijeljeno: { kljuc: string; playerId: string }[],
  izracunato: { kljuc: string; playerId: string }[]
): Promise<string[]> {
  const stari = new Map(dodijeljeno.map((x) => [x.kljuc, x.playerId]));
  const novi = new Map(izracunato.map((x) => [x.kljuc, x.playerId]));
  const kljucevi = [...new Set([...stari.keys(), ...novi.keys()])].sort();

  const idevi = new Set<string>();
  for (const k of kljucevi) {
    const a = stari.get(k);
    const b = novi.get(k);
    if (a !== b) {
      if (a) idevi.add(a);
      if (b) idevi.add(b);
    }
  }
  if (idevi.size === 0) return [];

  const igraci = await prisma.player.findMany({
    where: { id: { in: [...idevi] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const ime = new Map(
    igraci.map((p) => [p.id, `${p.lastName} ${p.firstName}`])
  );

  const razlike: string[] = [];
  for (const k of kljucevi) {
    const a = stari.get(k);
    const b = novi.get(k);
    if (a === b) continue;
    if (a && b) {
      razlike.push(`${k}: uručeno ${ime.get(a)}, izračun daje ${ime.get(b)}`);
    } else if (a) {
      razlike.push(`${k}: uručeno ${ime.get(a)}, izračun je više ne dodjeljuje`);
    } else if (b) {
      razlike.push(`${k}: nije uručena, izračun daje ${ime.get(b)}`);
    }
  }
  return razlike;
}
