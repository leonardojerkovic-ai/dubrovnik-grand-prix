import { prisma } from "@/lib/prisma";
import { RatingsTable } from "./ratings-table";

export default async function AdminRatingsPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { ratingsCurrent: true },
  });

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-1">
        Mjesečno ažuriranje rejtinga
      </h2>
      <p className="mb-4 text-sm text-ink/60">
        Unesi trenutne FIDE rejtinge za sve igrače odjednom (čl. 7 — ažurira
        se svakog 1. u mjesecu).
      </p>
      <RatingsTable
        players={players.map((p) => ({
          id: p.id,
          name: `${p.lastName} ${p.firstName}`,
          standard: p.ratingsCurrent?.standard ?? null,
          rapid: p.ratingsCurrent?.rapid ?? null,
          blitz: p.ratingsCurrent?.blitz ?? null,
        }))}
      />
    </div>
  );
}
