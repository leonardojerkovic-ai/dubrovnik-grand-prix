import { matchesCriteria, type PrizeCriteria } from "../scoring/prizes";

/**
 * Raspodjela NOVČANIH nagrada na turniru.
 *
 * Pravilo koje ovo provodi, doslovno iz raspisa:
 *
 *   „Nagrade nisu kumulativne. U slučaju da jedan igrač osvoji više nagrada,
 *    igrač će dobiti veću nagradu. Ako su nagrade jednake igrač će dobiti
 *    posebnu nagradu prema objavljenom redoslijedu posebnih nagrada."
 *
 * Zadnja rečenica podnosi dva čitanja, i Klub bira koje vrijedi za pojedini
 * raspis (vidi PravilaJednakosti):
 *
 *  - „posebna nagrada" doslovno: pri jednakom iznosu igrač uzima POSEBNU, a
 *    opće mjesto pada na sljedećeg;
 *  - rečenica razrješava jednakost samo MEĐU POSEBNIM nagradama, dok je
 *    opće mjesto iznad njih.
 *
 * Kod ne presuđuje između tih čitanja. Odluka je Klubova i vidi se u
 * obrascu.
 *
 * Iz toga slijedi redoslijed kojim se nagrade dodjeljuju — po IZNOSU, a ne
 * po vrsti. To je bitna razlika u odnosu na medalje Akademije (čl. 19), gdje
 * redoslijed propisuje pravilnik. Ovdje ga propisuje novac:
 *
 *  1. veći iznos ide prije manjeg;
 *  2. pri jednakom iznosu odlučuje odabrano pravilo;
 *  3. među posebnim nagradama odlučuje objavljeni redoslijed.
 *
 * Svaka se nagrada zatim daje najbolje plasiranom igraču koji zadovoljava
 * njezine uvjete i još nije ništa dobio. Time igrač uvijek završi s najvećom
 * nagradom koja mu je bila dostupna: veća se obrađuje prva, pa ako je nije
 * dobio, dobio ju je netko bolje plasiran.
 *
 * Nagrada koju igrač ne uzme jer je dobio veću prelazi na sljedećeg igrača
 * koji zadovoljava njezine uvjete, pa se fond podijeli u cijelosti.
 */

export interface NovcanaNagrada extends PrizeCriteria {
  id: string;
  /** Kako se nagrada zove u raspisu, npr. „1. mjesto" ili „Najbolja igračica". */
  naziv: string;
  /** Iznos po primjerku, u eurima. */
  iznos: number;
  /** false = opće mjesto u poretku, true = posebna nagrada. */
  posebna: boolean;
  /**
   * Mjesto u objavljenom redoslijedu. Odlučuje samo kad su iznosi jednaki,
   * i to među posebnim nagradama. Manji broj = ranije objavljena.
   */
  redoslijed: number;
  /** Koliko se primjeraka te nagrade dodjeljuje. */
  broj: number;
  /**
   * Dobna oznaka iz koje su izvedene granice godišta, npr. „U20".
   * Služi igračima kojima godište nije poznato — njih se prepoznaje po
   * istoj oznaci u poretku.
   */
  oznaka?: string | null;
  /**
   * Je li gornja granica rejtinga uključiva.
   *
   * Zadano je ISKLJUČIVA, jer tako glasi uobičajena oznaka: U1800 znači
   * rejting manji od 1800. Raspis koji kaže „do 1800 uključivo" postavlja
   * ovo na true.
   */
  rejtingDoUkljucivo?: boolean;
  /**
   * Titule koje nagrada traži, npr. ["IM"] ili ["IM", "FM"].
   *
   * Usporedba je doslovna: WIM nije IM. Ženske titule su zasebne titule, a
   * ne inačice muških, pa bi svako „pametno" poklapanje značilo da nagrada
   * za IM-a ode WIM-ici — ili obrnuto.
   */
  titule?: string[] | null;
}

export interface Natjecatelj {
  /** Redoslijed u konačnom poretku, 1 = pobjednik. */
  mjesto: number;
  ime: string;
  godiste: number | null;
  spol: "M" | "F" | null;
  /** Rejting na dan turnira; bez rejtinga se računa kao 1400. */
  rejting: number | null;
  clan: boolean;
  /** Klub iz izvora, kad ga izvoz nosi. Služi utvrđivanju članstva. */
  klub?: string;
  /**
   * Titula ispred imena, onako kako je daje izvoz: GM, IM, FM, WIM, MK…
   * Swiss-Manager u istom stupcu nosi i nacionalne kategorije (MK, I, II),
   * pa se ovdje ništa ne tumači — samo prepisuje.
   */
  titula?: string;
  /**
   * Dobne oznake kakve daje Swiss-Manager u stupcu „Vrsta" — U20, S65 i
   * slično. Vrijede samo kad godište nije poznato; tada je ta oznaka jedini
   * podatak o dobi koji izvoz uopće sadrži.
   */
  kategorije?: string[];
}

export interface Dodjela {
  nagradaId: string;
  naziv: string;
  iznos: number;
  /** Koji je ovo primjerak nagrade kad ih se dodjeljuje više. */
  primjerak: number;
  /** Prazno kad nema nijednog igrača koji zadovoljava uvjete. */
  ime: string | null;
  mjesto: number | null;
  /** Nagrada nije pripala najbolje plasiranom igraču koji je zadovoljava. */
  prenesena: boolean;
}

/** Igrač bez rejtinga računa se kao 1400 — isto kao kod F_R (čl. 24). */
const BEZ_REJTINGA_KAO = 1400;

function zadovoljavaRejting(n: Natjecatelj, nagrada: NovcanaNagrada): boolean {
  const rejting = n.rejting ?? BEZ_REJTINGA_KAO;

  if (nagrada.ratingMin !== null && nagrada.ratingMin !== undefined) {
    if (rejting < nagrada.ratingMin) return false;
  }

  if (nagrada.ratingMax !== null && nagrada.ratingMax !== undefined) {
    const prolazi = nagrada.rejtingDoUkljucivo
      ? rejting <= nagrada.ratingMax
      : rejting < nagrada.ratingMax;
    if (!prolazi) return false;
  }

  return true;
}

/**
 * Kandidat u obliku koji razumije matchesCriteria iz lib/scoring/prizes.
 * Igrač bez zapisanog spola ili godišta ne može zadovoljiti nagradu koja
 * po tome postavlja uvjet — a nagradu bez takvog uvjeta može.
 */
function kaoKandidat(n: Natjecatelj, index: number) {
  return {
    playerId: String(index),
    rank: n.mjesto,
    birthYear: n.godiste ?? Number.NaN,
    gender: n.spol ?? ("?" as "M" | "F"),
    rating: n.rejting,
    wasClubMember: n.clan,
  };
}

function zadovoljava(n: Natjecatelj, index: number, nagrada: NovcanaNagrada): boolean {
  // Nepoznato godište ne smije proći kroz usporedbu s NaN, koja je uvijek
  // false u jednom smjeru i true u drugom.
  const trebaGodiste =
    nagrada.birthYearMin !== null && nagrada.birthYearMin !== undefined
      ? true
      : nagrada.birthYearMax !== null && nagrada.birthYearMax !== undefined;
  if (nagrada.gender && n.spol === null) return false;
  if (!zadovoljavaRejting(n, nagrada)) return false;

  if (nagrada.titule && nagrada.titule.length > 0) {
    const igraceva = n.titula?.trim().toUpperCase();
    if (!igraceva) return false;
    if (!nagrada.titule.some((t) => t.trim().toUpperCase() === igraceva)) return false;
  }

  // Rejting je već provjeren — granice se maknu da matchesCriteria ne bi
  // gornju tumačio kao isključivu i onda kad raspis kaže drukčije.
  const bezRejtinga = { ...nagrada, ratingMin: null, ratingMax: null };

  if (trebaGodiste && n.godiste === null) {
    // Godišta nema. Jedini preostali podatak o dobi je oznaka iz izvoza, i
    // vrijedi samo ako se točno poklapa s oznakom nagrade — S65 ne pokriva
    // S60, jer izvoz ne kaže je li igrač i za nju star dovoljno.
    if (!nagrada.oznaka) return false;
    const trazena = nagrada.oznaka.toUpperCase();
    if (!(n.kategorije ?? []).some((k) => k.toUpperCase() === trazena)) return false;

    // Ostali uvjeti (spol, rejting, članstvo) i dalje moraju proći, pa se
    // dobne granice privremeno maknu.
    return matchesCriteria(kaoKandidat(n, index), {
      ...bezRejtinga,
      birthYearMin: null,
      birthYearMax: null,
    });
  }

  return matchesCriteria(kaoKandidat(n, index), bezRejtinga);
}

/**
 * Što ima prednost kad su iznosi jednaki.
 *
 * `OPCE_PRIJE` — opće mjesto je iznad posebnih nagrada.
 * `POSEBNA_PRIJE` — igrač uzima posebnu nagradu, a opće mjesto pada dalje.
 */
export type PravilaJednakosti = "OPCE_PRIJE" | "POSEBNA_PRIJE";

export const ZADANO_PRAVILO: PravilaJednakosti = "OPCE_PRIJE";

/** Redoslijed obrade: iznos, pa odabrano pravilo, pa objavljeni redoslijed. */
export function redoslijedDodjele(
  nagrade: NovcanaNagrada[],
  pravilo: PravilaJednakosti = ZADANO_PRAVILO
): NovcanaNagrada[] {
  return [...nagrade].sort((a, b) => {
    if (a.iznos !== b.iznos) return b.iznos - a.iznos;
    if (a.posebna !== b.posebna) {
      const posebnaPrva = pravilo === "POSEBNA_PRIJE";
      return a.posebna === posebnaPrva ? -1 : 1;
    }
    return a.redoslijed - b.redoslijed;
  });
}

/**
 * Potpis uvjeta nagrade.
 *
 * Nagrade s istim uvjetima čine niz: „1., 2. i 3. mjesto" nemaju nijedan
 * uvjet, „igrači 2201–2400 1., 2. i 3. mjesto" imaju iste granice rejtinga.
 * Unutar takvog niza n-ta nagrada po redu prirodno pripada n-tom igraču
 * koji uvjete zadovoljava — treće mjesto trećem igraču, a ne prvom.
 *
 * Bez toga bi svaka nagrada osim prve u nizu ispala „prenesena", pa bi
 * oznaka stajala gotovo uz svaku i ne bi značila ništa.
 */
function potpisUvjeta(n: NovcanaNagrada): string {
  return JSON.stringify([
    n.gender ?? null,
    n.birthYearMin ?? null,
    n.birthYearMax ?? null,
    n.oznaka?.toUpperCase() ?? null,
    n.ratingMin ?? null,
    n.ratingMax ?? null,
    n.rejtingDoUkljucivo ?? false,
    n.clubMembersOnly ?? false,
    (n.titule ?? []).map((t) => t.trim().toUpperCase()).sort(),
  ]);
}

export function dodijeliNagrade(
  poredak: Natjecatelj[],
  nagrade: NovcanaNagrada[],
  pravilo: PravilaJednakosti = ZADANO_PRAVILO
): Dodjela[] {
  const zauzeti = new Set<number>();
  const rezultat: Dodjela[] = [];
  /** Koliko je nagrada s istim uvjetima već podijeljeno. */
  const potroseno = new Map<string, number>();

  for (const nagrada of redoslijedDodjele(nagrade, pravilo)) {
    const potpis = potpisUvjeta(nagrada);
    const ocekivani = poredak
      .map((n, i) => [n, i] as const)
      .filter(([n, i]) => zadovoljava(n, i, nagrada));

    for (let primjerak = 1; primjerak <= nagrada.broj; primjerak++) {
      // Kome bi nagrada pripala da nitko nije uzeo veću.
      const redniBroj = potroseno.get(potpis) ?? 0;
      potroseno.set(potpis, redniBroj + 1);
      const prirodni = ocekivani[redniBroj];

      const dobitnik = ocekivani.find(([, i]) => !zauzeti.has(i));

      if (!dobitnik) {
        rezultat.push({
          nagradaId: nagrada.id,
          naziv: nagrada.naziv,
          iznos: nagrada.iznos,
          primjerak,
          ime: null,
          mjesto: null,
          prenesena: false,
        });
        continue;
      }

      const [natjecatelj, index] = dobitnik;
      zauzeti.add(index);

      rezultat.push({
        nagradaId: nagrada.id,
        naziv: nagrada.naziv,
        iznos: nagrada.iznos,
        primjerak,
        ime: natjecatelj.ime,
        mjesto: natjecatelj.mjesto,
        prenesena: prirodni !== undefined && prirodni[1] !== index,
      });
    }
  }

  return rezultat;
}

/** Zbroj stvarno dodijeljenih iznosa. */
export function ukupnoIsplaceno(dodjele: Dodjela[]): number {
  return dodjele.reduce((zbroj, d) => (d.ime ? zbroj + d.iznos : zbroj), 0);
}

/** Zbroj cijelog objavljenog fonda, bez obzira je li sve dodijeljeno. */
export function ukupanFond(nagrade: NovcanaNagrada[]): number {
  return nagrade.reduce((zbroj, n) => zbroj + n.iznos * n.broj, 0);
}
