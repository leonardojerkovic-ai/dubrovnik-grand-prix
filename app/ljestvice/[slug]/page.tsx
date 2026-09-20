import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGpStandings } from "@/lib/standings/gp";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { StandingsTable } from "@/components/standings-table";
import Link from "next/link";
import { STANDING_SLUGS, seasonSlug } from "@/lib/standings/slugs";
import { CsvDownload } from "@/components/csv-download";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

const SLUG_MAP = STANDING_SLUGS;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const config = SLUG_MAP[params.slug];
  if (!config) return {};
  return {
    title: `Ljestvica — ${config.title}`,
    description: `Trenutni poredak na ljestvici ${config.title} Dubrovnik Grand Prixa.`,
  };
}

export default async function StandingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const config = SLUG_MAP[params.slug];
  if (!config) notFound();

  const activeSeason = await prisma.season.findFirst({
    where: { system: config.system, isActive: true },
  });

  if (!activeSeason) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-navy mb-4">
          {config.title}
        </h1>
        <p className="text-ink/60">
          Trenutno nema aktivne sezone za{" "}
          {config.system === "GP" ? "Dubrovnik GP" : "GP Akademije"}.
        </p>
      </div>
    );
  }

  const rows =
    config.system === "GP"
      ? await getGpStandings(activeSeason.id, config.category!)
      : await getAkademijaStandings(activeSeason.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        {config.system === "AKADEMIJA" && (
          <Image
            src="/logo-akademija.png"
            alt="ŠK Dubrovnik Akademija"
            width={64}
            height={64}
            className="h-16 w-16 flex-shrink-0"
          />
        )}
        <div>
          <span
            className={`badge-title mb-2 inline-block ${
              config.system === "AKADEMIJA" ? "bg-academy/15 text-academy" : ""
            }`}
          >
            Sezona {activeSeason.yearLabel}
          </span>
          <h1 className="font-display text-2xl font-bold text-navy">
            {config.title}
          </h1>
        </div>
      </div>
      <StandingsTable rows={rows ?? []} />

      <p className="mt-4 text-xs text-ink/55">
        Ova adresa uvijek pokazuje aktivnu sezonu. Za trajnu poveznicu na ovaj
        poredak koristi{" "}
        <Link
          href={`/ljestvice/${seasonSlug(activeSeason.yearLabel)}/${params.slug}`}
          className="font-medium text-navy hover:underline"
        >
          /ljestvice/{seasonSlug(activeSeason.yearLabel)}/{params.slug}
        </Link>
        .
      </p>

      {(rows?.length ?? 0) > 0 && (
        <CsvDownload
          href={`/ljestvice/${params.slug}/csv`}
          label="Preuzmi ljestvicu (CSV)"
        />
      )}
    </div>
  );
}
