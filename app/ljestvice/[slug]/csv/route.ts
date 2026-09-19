import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGpStandings } from "@/lib/standings/gp";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { STANDING_SLUGS } from "@/lib/standings/slugs";
import { csvFileName, csvResponse, toCsv } from "@/lib/csv";

/**
 * Izvoz ljestvice u CSV.
 *
 * Izvozi se ISTI poredak koji se vidi na stranici — ista funkcija, isti
 * redoslijed — da se izvezena tablica ne može razići s objavljenom.
 *
 * Uz ukupan zbroj idu i dva broja koja objašnjavaju kako je nastao: koliko
 * je turnira igrač odigrao i koliko je rezultata ušlo u zbroj. Bez njih
 * izvezena ljestvica ne može odgovoriti na najčešće pitanje — zašto netko s
 * više odigranih turnira ima manje bodova (čl. 27.a, kvota).
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const config = STANDING_SLUGS[params.slug];
  if (!config) notFound();

  const season = await prisma.season.findFirst({
    where: { system: config.system, isActive: true },
  });
  if (!season) notFound();

  const rows =
    config.system === "GP"
      ? await getGpStandings(season.id, config.category!)
      : await getAkademijaStandings(season.id);

  const csv = toCsv(
    [
      "Mjesto",
      "Titula",
      "Prezime i ime",
      "Bodovi",
      "Odigrano turnira",
      "Rezultata u zbroju",
    ],
    (rows ?? []).map((row, index) => [
      index + 1,
      row.player.title === "NONE" ? "" : row.player.title,
      `${row.player.lastName} ${row.player.firstName}`,
      row.total,
      row.allResults.length,
      row.countedResults.length,
    ])
  );

  return csvResponse(
    csvFileName("ljestvica", config.title, season.yearLabel),
    csv
  );
}
