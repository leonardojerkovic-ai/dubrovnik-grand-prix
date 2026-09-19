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
 * Polje se navodi pod navodnicima samo kad treba — ako sadrži razdjelnik,
 * navodnik, prijelom retka ili rubni razmak. Navodnik se udvostručuje.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
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
