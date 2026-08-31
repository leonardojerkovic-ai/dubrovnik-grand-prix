import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TournamentRegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      registrations: {
        where: { status: "PRIJAVLJEN" },
        orderBy: { registeredAt: "asc" },
        include: { player: true },
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">
          Prijave — {tournament.name}
        </h2>
        <Link
          href={`/admin/tournaments/${tournament.id}`}
          className="text-sm text-navy hover:text-crimson"
        >
          ← Uredi turnir
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Igrač</th>
              <th className="px-4 py-3">Prijavljen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {tournament.registrations.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  {r.player.lastName} {r.player.firstName}
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {r.registeredAt.toLocaleString("hr-HR")}
                </td>
              </tr>
            ))}
            {tournament.registrations.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-ink/50">
                  Još nema prijava.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
