/**
 * Smije li uvoz pisati preko već postojećeg snimka za taj datum.
 *
 * Službene FIDE liste su mjerodavne; Lichess je izvedeni izvor i zna
 * zaostajati. Na prijelazu mjeseca to zaostajanje nije bezazleno: 1.11.2026.
 * Lichess je još služio listopadsku listu, pa je uvoz s njega prepisao
 * svježe studenske vrijednosti listopadskima — i to tiho, bez ijedne
 * greške. Dvadeset i jedan igrač vratio se na prošlomjesečni rejting.
 *
 * Zato Lichess ne smije pregaziti snimak koji za taj datum već postoji.
 * Obrnuti smjer je dopušten: službena lista uvijek smije ispraviti ono što
 * je Lichess upisao.
 *
 * Prvi uvoz u mjesecu s Lichessa prolazi normalno — tada snimka još nema.
 */
export function smijePisati(input: {
  izvor: "lichess" | "fide";
  postojiSnimak: boolean;
  prepisi: boolean;
}): boolean {
  if (input.izvor === "fide") return true;
  if (!input.postojiSnimak) return true;
  return input.prepisi;
}

/** Objašnjenje za korisnika kad se uvoz odbije. */
export function porukaOdbijanja(datum: string): string {
  return [
    `Za ${datum} već postoji snimak u bazi, a uvoz ide s Lichessa.`,
    "",
    "Lichess je izvedeni izvor i na prijelazu mjeseca zna zaostajati za",
    "službenom listom — upis bi mogao vratiti prošlomjesečne vrijednosti",
    "preko ovomjesečnih, bez ijedne greške koja bi se vidjela.",
    "",
    "Što možeš:",
    "  npm run fide:import -- --usporedi          vidi razlikuju li se izvori",
    "  npm run fide:import -- --izvor=fide        uvezi sa službene liste",
    "  npm run fide:import -- --prepisi           svejedno piši s Lichessa",
    "",
    "Ništa nije upisano.",
  ].join("\n");
}
