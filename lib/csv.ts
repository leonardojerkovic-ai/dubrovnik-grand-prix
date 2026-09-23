/**
 * Izvoz tablica u CSV.
 *
 * Dvije odluke koje izgledaju sitno, a odlučuju hoće li datoteka uopće biti
 * upotrebljiva u Excelu na hrvatskom Windowsu:
 *
 * 1. Razdjelnik je točka-zarez, ne zarez. Excel u hrvatskoj regionalnoj
 *    postavci očekuje ";" i datoteku sa zarezima otvori kao jedan stupac.
 * 2. Datoteka počinje BOM-om. Bez njega Excel učita UTF-8 kao ANSI, pa od
 *    "Končarević" postane "KonÄarević".
 *
 * Retci se odvajaju CRLF-om, kako nalaže RFC 4180.
 */

const DELIMITER = ";";
const BOM = "﻿";

/**
 * Znakovi kojima Excel i LibreOffice započinju formulu.
 *
 * Ćelija koja počinje jednim od njih izvršava se pri otvaranju datoteke.
 * Imena igrača upisuju sami korisnici pri registraciji i završavaju u javnom
 * izvozu ljestvica, pa bi ime oblika =HYPERLINK(...) postalo formula na
 * tuđem računalu. Napad je poznat kao CSV injection.
 */
const FORMULA_STARTERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Polje se navodi pod navodnicima samo kad treba — ako sadrži razdjelnik,
 * navodnik, prijelom retka ili rubni razmak. Navodnik se udvostručuje.
 *
 * Prije toga se, ako počinje znakom formule, ispred dodaje apostrof. Excel ga
 * tumači kao „ovo je tekst" i ne prikazuje ga u ćeliji.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (FORMULA_STARTERS.some((c) => text.startsWith(c))) {
    text = "'" + text;
  }
  const needsQuotes =
    text.includes(DELIMITER) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r") ||
    text !== text.trim();
  if (!needsQuotes) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCell).join(DELIMITER)
  );
  return BOM + lines.join("\r\n") + "\r\n";
}

/**
 * Naziv datoteke bez dijakritike i razmaka — neki preglednici i sustavi
 * datoteka ih ne podnose dobro u Content-Disposition zaglavlju.
 */
export function csvFileName(...parts: string[]): string {
  const base = parts
    .join("-")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "izvoz"}.csv`;
}

export function csvResponse(fileName: string, content: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
