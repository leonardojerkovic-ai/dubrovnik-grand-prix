import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddRegistrationForm } from "./add-registration-form";
import { adminAddRegistration, adminRemoveRegistration } from "./actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function TournamentRegistrationsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const [tournament, allPlayers] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        registrations: {
          where: { status: { in: ["PRIJAVLJEN", "NA_CEKANJU"] } },
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

  // Dva popisa: potvrđeni i lista čekanja, oba po trenutku prijave. Red
  // čekanja je upravo taj redoslijed, pa se broj mjesta u redu čita iz
  // položaja u popisu.
  const prijavljeni = tournament.registrations.filter(
    (r) => r.status === "PRIJAVLJEN"
  );
  const naCekanju = tournament.registrations.filter(
    (r) => r.status === "NA_CEKANJU"
  );

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
          {tournament.maxPlayers !== null && (
            <span className="ml-2 text-sm font-normal text-muted">
              {prijavljeni.length}/{tournament.maxPlayers} mjesta
            </span>
          )}
        </h2>
        <Link
          href={`/admin/tournaments/${tournament.id}`}
          className="text-sm text-navy hover:text-crimson"
        >
          ← Uredi turnir
        </Link>
      </div>

      <AddRegistrationForm tournamentId={tournament.id} players={availablePlayers} />

      <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Igrač</th>
              <th className="px-4 py-3">Prijavljen</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {prijavljeni.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  {r.player.lastName} {r.player.firstName}
                </td>
                <td className="px-4 py-3 text-muted">
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
            {prijavljeni.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  Još nema prijava.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {naCekanju.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-display text-base font-bold text-navy">
            Lista čekanja
            <span className="ml-2 text-sm font-normal text-muted">
              {naCekanju.length}
            </span>
          </h3>
          <p className="mb-3 text-sm text-muted">
            Kad se netko odjavi, prvi s liste automatski ulazi među
            prijavljene i dobiva poruku e-poštom. Isto se dogodi ako povisiš
            broj mjesta. Dodaš li igrača ručno, kvota se ne primjenjuje.
          </p>
          <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Igrač</th>
                  <th className="px-4 py-3">Na listi od</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {naCekanju.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 tabular-nums text-muted">{i + 1}.</td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {r.player.lastName} {r.player.firstName}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.registeredAt.toLocaleString("hr-HR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await adminAddRegistration(tournament.id, r.playerId);
                        }}
                      >
                        <button type="submit" className="btn-secondary btn-sm">
                          Pusti unutra
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
