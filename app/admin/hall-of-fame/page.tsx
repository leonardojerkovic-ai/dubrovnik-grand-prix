import { prisma } from "@/lib/prisma";
import { createHallOfFameEntry, deleteHallOfFameEntry } from "./actions";
import { HallOfFameForm } from "./hall-of-fame-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function AdminHallOfFamePage() {
  const [entries, seasons, players] = await Promise.all([
    prisma.hallOfFame.findMany({
      orderBy: [{ seasonId: "desc" }, { categoryCode: "asc" }, { place: "asc" }],
      include: { season: true, player: true },
    }),
    prisma.season.findMany({
      orderBy: [{ system: "asc" }, { yearLabel: "desc" }],
      select: { id: true, yearLabel: true, system: true },
    }),
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Hall of Fame ({entries.length})
      </h2>

      <div className="mb-8 rounded-lg border border-navy/10 bg-white p-4">
        <HallOfFameForm
          action={createHallOfFameEntry}
          seasons={seasons}
          players={players.map((p) => ({
            id: p.id,
            label: `${p.lastName} ${p.firstName}`,
          }))}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Sezona</th>
              <th className="px-4 py-3">Kategorija</th>
              <th className="px-4 py-3">Mjesto</th>
              <th className="px-4 py-3">Igrač</th>
              <th className="px-4 py-3">Bodovi</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  {e.season.system === "GP" ? "GP" : "Akademija"} {e.season.yearLabel}
                </td>
                <td className="px-4 py-3">{e.categoryCode}</td>
                <td className="px-4 py-3">{e.place}.</td>
                <td className="px-4 py-3 font-medium text-navy">
                  {e.player.lastName} {e.player.firstName}
                </td>
                <td className="px-4 py-3 font-mono">{e.pointsTotal}</td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteHallOfFameEntry(e.id);
                    }}
                  >
                    <ConfirmDeleteButton />
                  </form>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  Još nema unesenih Hall of Fame zapisa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
