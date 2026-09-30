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
 * Zadnja rečenica razrješava jednakost MEĐU POSEBNIM nagradama — koju od
 * više jednakih posebnih igrač dobiva. Odnos općeg mjesta i posebne nagrade
 * pri jednakom iznosu uređen je zasebno, odlukom Kluba: opće mjesto je iznad
 * posebnih.
 *
 * Iz toga slijedi redoslijed kojim se nagrade dodjeljuju — po IZNOSU, a ne
 * po vrsti. To je bitna razlika u odnosu na medalje Akademije (čl. 19), gdje
 * redoslijed propisuje pravilnik. Ovdje ga propisuje novac:
 *
 *  1. veći iznos ide prije manjeg;
 *  2. pri jednakom iznosu opće mjesto ide prije posebne nagrade;
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
      ...nagrada,
      birthYearMin: null,
      birthYearMax: null,
    });
  }

  return matchesCriteria(kaoKandidat(n, index), nagrada);
}

/** Redoslijed obrade: iznos, pa opće prije posebne, pa objavljeni redoslijed. */
export function redoslijedDodjele(nagrade: NovcanaNagrada[]): NovcanaNagrada[] {
  return [...nagrade].sort((a, b) => {
    if (a.iznos !== b.iznos) return b.iznos - a.iznos;
    if (a.posebna !== b.posebna) return a.posebna ? 1 : -1;
    return a.redoslijed - b.redoslijed;
  });
}

export function dodijeliNagrade(
  poredak: Natjecatelj[],
  nagrade: NovcanaNagrada[]
): Dodjela[] {
  const zauzeti = new Set<number>();
  const rezultat: Dodjela[] = [];

  for (const nagrada of redoslijedDodjele(nagrade)) {
    // Tko bi nagradu dobio da nema pravila o nekumulativnosti — po tome se
    // prepoznaje je li prenesena.
    const ocekivani = poredak
      .map((n, i) => [n, i] as const)
      .filter(([n, i]) => zadovoljava(n, i, nagrada));

    for (let primjerak = 1; primjerak <= nagrada.broj; primjerak++) {
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

      const bezPravila = ocekivani[primjerak - 1];
      rezultat.push({
        nagradaId: nagrada.id,
        naziv: nagrada.naziv,
        iznos: nagrada.iznos,
        primjerak,
        ime: natjecatelj.ime,
        mjesto: natjecatelj.mjesto,
        prenesena: bezPravila !== undefined && bezPravila[1] !== index,
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
