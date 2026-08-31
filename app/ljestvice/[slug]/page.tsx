import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getGpStandings, type GpCategoryCode } from "@/lib/standings/gp";
import { getAkademijaStandings } from "@/lib/standings/akademija";
import { StandingsTable } from "@/components/standings-table";

const SLUG_MAP: Record<string, { system: "GP" | "AKADEMIJA"; category?: GpCategoryCode; title: string }> = {
  "opci-gp": { system: "GP", category: "OPCI", title: "Opći GP" },
  "zene": { system: "GP", category: "ZENE", title: "Žene" },
  u20: { system: "GP", category: "U20", title: "Juniori U20" },
  u16: { system: "GP", category: "U16", title: "Kadeti U16" },
  u12: { system: "GP", category: "U12", title: "Mlađi kadeti U12" },
  s50: { system: "GP", category: "S50", title: "Veterani +50" },
  s65: { system: "GP", category: "S65", title: "Veterani +65" },
  u1800: { system: "GP", category: "U1800", title: "U1800" },
  akademija: { system: "AKADEMIJA", title: "GP Akademije" },
};

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
    </div>
  );
}
