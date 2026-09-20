/**
 * Status dokumenta vezanog uz sezonu.
 *
 * Izvodi se iz datuma sezone, a NE iz Season.isActive. To nije sitnica:
 * `isActive` označava sezonu s kojom admin trenutno radi, pa je GP 2027 bio
 * aktivan još u rujnu 2026., iako pravilnik stupa na snagu tek 1.1.2027. Da
 * se status vukao odatle, članovi bi vidjeli da pravilnik već vrijedi tri i
 * pol mjeseca prije nego doista vrijedi.
 */

export type DocumentStatus = "NA_SNAZI" | "USKORO" | "ARHIVA";

export interface DocumentSeasonInfo {
  startDate: Date;
  endDate: Date;
  rulebookVersion: string | null;
}

export function documentStatus(
  season: DocumentSeasonInfo,
  now: Date = new Date()
): DocumentStatus {
  if (now < season.startDate) return "USKORO";
  if (now > season.endDate) return "ARHIVA";
  return "NA_SNAZI";
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function statusLabel(status: DocumentStatus, startDate: Date): string {
  switch (status) {
    case "NA_SNAZI":
      return "Na snazi";
    case "USKORO":
      return `Vrijedi od ${formatDate(startDate)}`;
    case "ARHIVA":
      return "Arhiva";
  }
}
