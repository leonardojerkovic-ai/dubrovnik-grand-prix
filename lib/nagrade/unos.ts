import type { Natjecatelj } from "./dodjela";

/**
 * Čita tablicu rezultata onakvu kakva ispadne kad se stupci označe u Excelu
 * i zalijepe u obrazac — dakle redci odvojeni novim redom, stupci tabom.
 *
 * Podnosi i točku-zarez i više razmaka umjesto taba, jer se tablice
 * prelijepljuju i iz drugih izvora.
 *
 * Posebno je predviđen ispis konačnog poretka iz Swiss-Managera, koji se
 * lijepi onakav kakav jest: zaglavlje ne mora biti u prvom retku, stupaca
 * ima dvadesetak i većina ih ovdje ne treba, dob dolazi kao oznaka U20/S65
 * u stupcu „Vrsta", žene su označene slovom w, a članstvo se čita iz
 * stupca „Klub/Grad".
 *
 * Poredak određuje REDOSLIJED REDAKA, ne eventualni stupac s mjestom.
 * Tako zalijepljena tablica uvijek znači ono što piše, i onda kad se u
 * izvorniku brojevi mjesta ponavljaju zbog dijeljenih mjesta.
 */

const ZAGLAVLJA: Record<string, keyof Natjecatelj | "mjesto"> = {
  mjesto: "mjesto",
  "mj.": "mjesto",
  mj: "mjesto",
  "rk.": "mjesto",
  rk: "mjesto",
  rank: "mjesto",
  no: "mjesto",
  rb: "mjesto",
  "r.b.": "mjesto",
  poredak: "mjesto",
  rang: "mjesto",
  ime: "ime",
  igrac: "ime",
  igrač: "ime",
  prezime: "ime",
  "ime i prezime": "ime",
  name: "ime",
  player: "ime",
  godiste: "godiste",
  godište: "godiste",
  rodjen: "godiste",
  rođen: "godiste",
  god: "godiste",
  kategorija: "kategorije",
  kategorije: "kategorije",
  vrsta: "kategorije",
  typ: "kategorije",
  type: "kategorije",
  spol: "spol",
  m_z: "spol",
  sex: "spol",
  s: "spol",
  rejting: "rejting",
  rating: "rejting",
  elo: "rejting",
  rtg: "rejting",
  rtgi: "rejting",
  rtgn: "rejting",
  clan: "clan",
  član: "clan",
  "član kluba": "clan",
  clanstvo: "clan",
  članstvo: "clan",
  titula: "titula",
  titule: "titula",
  title: "titula",
  tit: "titula",
  zvanje: "titula",
  klub: "klub",
  club: "klub",
  "club/city": "klub",
  "club / city": "klub",
  "klub/grad": "klub",
  "klub / grad": "klub",
  klubgrad: "klub",
};

/** Koliko se prvih redaka pregleda u potrazi za zaglavljem. */
const REDAKA_ZA_ZAGLAVLJE = 5;

/** Redoslijed stupaca kad zaglavlja nema. */
const ZADANI_STUPCI = ["ime", "godiste", "spol", "rejting", "clan"] as const;

export interface GreskaUnosa {
  redak: number;
  poruka: string;
}

export interface RezultatUnosa {
  natjecatelji: Natjecatelj[];
  greske: GreskaUnosa[];
}

function podijeli(redak: string): string[] {
  const raw = redak.includes("\t")
    ? redak.split("\t")
    : redak.includes(";")
      ? redak.split(";")
      : redak.split(/\s{2,}/);
  return raw.map((c) => c.trim());
}

function prepoznajZaglavlje(celije: string[]): (string | null)[] | null {
  const mapirano = celije.map((c) => ZAGLAVLJA[c.toLowerCase().trim()] ?? null);
  // Zaglavlje je zaglavlje tek ako se prepozna barem ime i još jedan stupac.
  const prepoznato = mapirano.filter(Boolean).length;
  return mapirano.includes("ime") && prepoznato >= 2 ? mapirano : null;
}

const MUSKI = ["m", "muški", "muski", "muško", "musko"];
const ZENSKI = ["ž", "z", "w", "f", "ženski", "zenski", "žensko", "zensko"];

function citajSpol(vrijednost: string): "M" | "F" | null {
  const v = vrijednost.toLowerCase().trim();
  if (v === "") return null;
  if (MUSKI.includes(v)) return "M";
  if (ZENSKI.includes(v)) return "F";
  return null;
}

/**
 * Swiss-Manager u stupcu „spol" označava SAMO žene, slovom w; muškarcima je
 * ćelija prazna. Ako se u cijelom stupcu ne pojavi nijedna muška oznaka, a
 * pojavi se barem jedna ženska, prazna ćelija znači muškarca.
 *
 * Bez toga bi svi muškarci ostali bez zapisanog spola, pa nijedna nagrada
 * koja spol postavlja kao uvjet ne bi mogla biti njihova. Zaključak se
 * donosi na razini stupca, ne retka, i samo kad ga podaci nedvojbeno nose.
 */
function praznoZnaciMuski(vrijednosti: string[]): boolean {
  let imaZenskih = false;
  for (const vrijednost of vrijednosti) {
    const v = vrijednost.toLowerCase().trim();
    if (v === "") continue;
    if (MUSKI.includes(v)) return false;
    if (ZENSKI.includes(v)) imaZenskih = true;
  }
  return imaZenskih;
}

function citajClanstvo(vrijednost: string): boolean {
  const v = vrijednost.toLowerCase().trim();
  return ["da", "d", "x", "✓", "1", "true", "član", "clan"].includes(v);
}

function citajBroj(vrijednost: string): number | null {
  const v = vrijednost.replace(/\s/g, "").replace(",", ".");
  if (v === "") return null;
  const broj = Number(v);
  return Number.isFinite(broj) ? Math.trunc(broj) : null;
}

/** Bez dijakritike i suvišnih razmaka, da se „ŠK" i „SK" poklope. */
function zaUsporedbu(tekst: string): string {
  return tekst
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface MogucnostiUnosa {
  /**
   * Naziv domaćeg kluba. Kad redak nema stupac o članstvu, ali ima klub,
   * članom se smatra onaj kome naziv kluba sadrži ovaj tekst.
   *
   * NAPOMENA: to je članstvo prema izvoru turnira, ne prema evidenciji
   * Kluba na dan turnira (čl. 4). Kod spornih slučajeva odlučuje evidencija.
   */
  domaciKlub?: string;
}

export function procitajTablicu(
  tekst: string,
  mogucnosti: MogucnostiUnosa = {}
): RezultatUnosa {
  const redci = tekst
    .split(/\r?\n/)
    .map((r) => r.trimEnd())
    .filter((r) => r.trim() !== "");

  if (redci.length === 0) {
    return { natjecatelji: [], greske: [] };
  }

  // Ispis iz Swiss-Managera počinje naslovom („Konačni poredak nakon 7
  // Kola"), pa zaglavlje nije nužno u prvom retku.
  let zaglavlje: (string | null)[] | null = null;
  let redakZaglavlja = -1;
  for (let i = 0; i < Math.min(REDAKA_ZA_ZAGLAVLJE, redci.length); i++) {
    const kandidat = prepoznajZaglavlje(podijeli(redci[i]!));
    if (kandidat) {
      zaglavlje = kandidat;
      redakZaglavlja = i;
      break;
    }
  }

  const podaci = zaglavlje ? redci.slice(redakZaglavlja + 1) : redci;
  const stupci: (string | null)[] = zaglavlje ?? [...ZADANI_STUPCI];

  // Swiss-Manager stupac s titulom ostavlja BEZ naziva, odmah lijevo od
  // imena. Prepoznaje se po položaju jer drugog traga nema.
  if (zaglavlje) {
    const indeksImena = stupci.indexOf("ime");
    if (indeksImena > 0 && stupci[indeksImena - 1] === null) {
      stupci[indeksImena - 1] = "titula";
    }
  }

  const indeksSpola = stupci.indexOf("spol");
  const svePoRetku = podaci.map(podijeli);
  const praznoJeMusko =
    indeksSpola >= 0 &&
    praznoZnaciMuski(svePoRetku.map((c) => c[indeksSpola] ?? ""));

  const domaci = mogucnosti.domaciKlub?.trim()
    ? zaUsporedbu(mogucnosti.domaciKlub)
    : null;

  const natjecatelji: Natjecatelj[] = [];
  const greske: GreskaUnosa[] = [];

  svePoRetku.forEach((celije, i) => {
    const brojRetka = i + 1 + (zaglavlje ? redakZaglavlja + 1 : 0);

    const polje = (naziv: string): string => {
      const index = stupci.indexOf(naziv);
      return index >= 0 ? (celije[index] ?? "").trim() : "";
    };

    const ime = polje("ime");
    if (ime === "") {
      greske.push({ redak: brojRetka, poruka: "Nema imena igrača." });
      return;
    }

    const godiste = citajBroj(polje("godiste"));
    if (godiste !== null && (godiste < 1900 || godiste > 2100)) {
      greske.push({
        redak: brojRetka,
        poruka: `${ime}: godište „${polje("godiste")}" nije godina.`,
      });
      return;
    }

    const spolIzCelije = citajSpol(polje("spol"));
    const klub = polje("klub");
    const imaStupacClanstva = stupci.includes("clan");

    natjecatelji.push({
      mjesto: natjecatelji.length + 1,
      ime,
      godiste,
      spol: spolIzCelije ?? (praznoJeMusko ? "M" : null),
      kategorije: polje("kategorije")
        .split(/[\s,;]+/)
        .map((k) => k.trim())
        .filter((k) => k !== ""),
      // Swiss-Manager neregistriranom igraču upisuje 0, a ne praznu ćeliju.
      rejting: citajBroj(polje("rejting")) || null,
      // Izričiti stupac o članstvu uvijek ima prednost pred nazivom kluba.
      clan: imaStupacClanstva
        ? citajClanstvo(polje("clan"))
        : domaci !== null && klub !== "" && zaUsporedbu(klub).includes(domaci),
      ...(klub !== "" ? { klub } : {}),
      ...(polje("titula") !== "" ? { titula: polje("titula") } : {}),
    });
  });

  return { natjecatelji, greske };
}
