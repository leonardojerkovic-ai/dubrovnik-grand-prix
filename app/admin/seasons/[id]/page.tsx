import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSeason } from "../actions";
import { SeasonForm } from "../season-form";

export default async function EditSeasonPage({
  params,
}: {
  params: { id: string };
}) {
  const season = await prisma.season.findUnique({ where: { id: params.id } });
  if (!season) notFound();

  const boundUpdateSeason = updateSeason.bind(null, season.id);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Uredi sezonu — {season.yearLabel}
      </h2>
      <SeasonForm
        action={boundUpdateSeason}
        defaultValues={{
          system: season.system,
          yearLabel: season.yearLabel,
          startDate: season.startDate,
          endDate: season.endDate,
          isActive: season.isActive,
          rulebookVersion: season.rulebookVersion,
        }}
      />
    </div>
  );
}
