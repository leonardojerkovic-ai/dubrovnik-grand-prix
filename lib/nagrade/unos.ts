import type { Natjecatelj } from "./dodjela";

/**
 * Čita tablicu rezultata onakvu kakva ispadne kad se stupci označe u Excelu
 * i zalijepe u obrazac — dakle redci odvojeni novim redom, stupci tabom.
 *
 * Podnosi i točku-zarez i više razmaka umjesto taba, jer se tablice
 * prelijepljuju i iz drugih izvora.
 *
 * Poredak određuje REDOSLIJED REDAKA, ne eventualni stupac s mjestom.
 * Tako zalijepljena tablica uvijek znači ono što piše, i onda kad se u
 * izvorniku brojevi mjesta ponavljaju zbog dijeljenih mjesta.
 */

const ZAGLAVLJA: Record<string, keyof Natjecatelj | "mjesto"> = {
  mjesto: "mjesto",
  rb: "mjesto",
  "r.b.": "mjesto",
  poredak: "mjesto",
  rang: "mjesto",
  ime: "ime",
  igrac: "ime",
  igrač: "ime",
  prezime: "ime",
  "ime i prezime": "ime",
  godiste: "godiste",
  godište: "godiste",
  rodjen: "godiste",
  rođen: "godiste",
  god: "godiste",
  kategorija: "kategorije",
  kategorije: "kategorije",
  vrsta: "kategorije",
  spol: "spol",
  m_z: "spol",
  rejting: "rejting",
  rating: "rejting",
  elo: "rejting",
  clan: "clan",
  član: "clan",
  "član kluba": "clan",
  clanstvo: "clan",
  članstvo: "clan",
};

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

function citajSpol(vrijednost: string): "M" | "F" | null {
  const v = vrijednost.toLowerCase().trim();
  if (v === "") return null;
  if (["m", "muški", "muski", "muško", "musko"].includes(v)) return "M";
  if (["ž", "z", "f", "ženski", "zenski", "žensko", "zensko"].includes(v)) return "F";
  return null;
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

export function procitajTablicu(tekst: string): RezultatUnosa {
  const redci = tekst
    .split(/\r?\n/)
    .map((r) => r.trimEnd())
    .filter((r) => r.trim() !== "");

  if (redci.length === 0) {
    return { natjecatelji: [], greske: [] };
  }

  const prviRedak = podijeli(redci[0]!);
  const zaglavlje = prepoznajZaglavlje(prviRedak);
  const podaci = zaglavlje ? redci.slice(1) : redci;
  const stupci: (string | null)[] = zaglavlje ?? [...ZADANI_STUPCI];

  const natjecatelji: Natjecatelj[] = [];
  const greske: GreskaUnosa[] = [];

  podaci.forEach((redak, i) => {
    const brojRetka = i + 1 + (zaglavlje ? 1 : 0);
    const celije = podijeli(redak);

    const polje = (naziv: string): string => {
      const index = stupci.indexOf(naziv);
      return index >= 0 ? (celije[index] ?? "") : "";
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

    natjecatelji.push({
      mjesto: natjecatelji.length + 1,
      ime,
      godiste,
      spol: citajSpol(polje("spol")),
      kategorije: polje("kategorije")
        .split(/[\s,;]+/)
        .map((k) => k.trim())
        .filter((k) => k !== ""),
      rejting: citajBroj(polje("rejting")),
      clan: citajClanstvo(polje("clan")),
    });
  });

  return { natjecatelji, greske };
}
