import { prisma } from "@/lib/prisma";
import { createTournament } from "../actions";
import { TournamentForm } from "../tournament-form";

export default async function NewTournamentPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ system: "asc" }, { yearLabel: "desc" }],
    select: { id: true, yearLabel: true, system: true },
  });

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Novi turnir
      </h2>
      {seasons.length === 0 && (
        <p className="mb-4 rounded-md bg-gold/10 px-3 py-2 text-sm text-navy">
          Nema još kreiranih sezona. Prvo kreiraj sezonu (Season) kroz Prisma
          Studio — admin UI za sezone dolazi u sljedećoj fazi.
        </p>
      )}
      <TournamentForm action={createTournament} seasons={seasons} />
    </div>
  );
}
