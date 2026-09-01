import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddRegistrationForm } from "./add-registration-form";
import { adminRemoveRegistration } from "./actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function TournamentRegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  const [tournament, allPlayers] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        registrations: {
          where: { status: "PRIJAVLJEN" },
          orderBy: { registeredAt: "asc" },
          include: { player: true },
        },
      },
    }),
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  if (!tournament) notFound();

  const registeredPlayerIds = new Set(tournament.registrations.map((r) => r.playerId));
  const availablePlayers = allPlayers
    .filter((p) => !registeredPlayerIds.has(p.id))
    .map((p) => ({ id: p.id, label: `${p.lastName} ${p.firstName}` }));

  const removeAction = adminRemoveRegistration.bind(null);

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

      <AddRegistrationForm tournamentId={tournament.id} players={availablePlayers} />

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Igrač</th>
              <th className="px-4 py-3">Prijavljen</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await removeAction(r.id, tournament.id);
                    }}
                  >
                    <ConfirmDeleteButton confirmText="Ukloniti ovu prijavu?">
                      Ukloni
                    </ConfirmDeleteButton>
                  </form>
                </td>
              </tr>
            ))}
            {tournament.registrations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink/50">
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
