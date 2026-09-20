import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGpStandings } from "@/lib/standings/gp";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { StandingsTable } from "@/components/standings-table";
import {
  STANDING_SLUGS,
  seasonSlug,
  yearLabelFromSlug,
} from "@/lib/standings/slugs";
import { CsvDownload } from "@/components/csv-download";
import { ObjectionNote } from "@/components/objection-note";

/**
 * Ljestvica određene sezone — trajna adresa oblika /ljestvice/2027/opci-gp.
 *
 * NAZIVI SEGMENATA: prvi se zove [slug] iako ovdje drži oznaku SEZONE. To
 * nije nemar — Next.js ne dopušta dva različita naziva dinamičkog segmenta
 * na istoj razini putanje, a /ljestvice/[slug] već postoji za aktivnu
 * sezonu. Zato je ovdje [slug] sezona, a [category] ljestvica.
 *
 * Postoji odvojeno od /ljestvice/[slug], koja uvijek pokazuje aktivnu
 * sezonu. Ta je dobra za svakodnevnu upotrebu, ali beskorisna za arhivu: čim
 * sezona završi, poredak po kojemu su dodijeljene medalje i nagrade nema
 * vlastitu adresu i ne može se ni podijeliti ni citirati.
 *
 * Završene sezone se više ne mijenjaju, pa se ova stranica gradi jednom i ne
 * osvježava vremenski — za razliku od ljestvice aktivne sezone.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string; category: string };
}): Promise<Metadata> {
  const config = STANDING_SLUGS[params.category];
  if (!config) return {};
  const yearLabel = yearLabelFromSlug(params.slug);
  return {
    title: `${config.title} — sezona ${yearLabel}`,
    description: `Konačni poredak na ljestvici ${config.title} za sezonu ${yearLabel}.`,
  };
}

export default async function ArchivedStandingsPage({
  params,
}: {
  params: { slug: string; category: string };
}) {
  const config = STANDING_SLUGS[params.category];
  if (!config) notFound();

  const yearLabel = yearLabelFromSlug(params.slug);

  const season = await prisma.season.findFirst({
    where: { system: config.system, yearLabel },
  });
  if (!season) notFound();

  const rows =
    config.system === "GP"
      ? await getGpStandings(season.id, config.category!)
      : await getAkademijaStandings(season.id);

  const otherSeasons = await prisma.season.findMany({
    where: { system: config.system },
    orderBy: { startDate: "desc" },
    select: { id: true, yearLabel: true, isActive: true },
  });

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
            Sezona {season.yearLabel}
            {season.rulebookVersion && ` · pravilnik ${season.rulebookVersion}`}
          </span>
          <h1 className="font-display text-2xl font-bold text-navy">
            {config.title}
          </h1>
        </div>
      </div>

      {otherSeasons.length > 1 && (
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink/55">Sezona:</span>
          {otherSeasons.map((s) => {
            const active = s.id === season.id;
            return (
              <Link
                key={s.id}
                href={`/ljestvice/${seasonSlug(s.yearLabel)}/${params.category}`}
                className={`rounded-md border px-2 py-1 font-medium ${
                  active
                    ? "border-navy bg-navy text-paper"
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}
              >
                {s.yearLabel}
              </Link>
            );
          })}
        </nav>
      )}

      <StandingsTable rows={rows ?? []} />

      {(rows?.length ?? 0) > 0 && <ObjectionNote />}

      {(rows?.length ?? 0) > 0 && (
        <CsvDownload
          href={`/ljestvice/${params.category}/csv`}
          label="Preuzmi ljestvicu (CSV)"
        />
      )}
    </div>
  );
}
