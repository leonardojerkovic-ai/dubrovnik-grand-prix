import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleSelect } from "./role-select";
import { PlayerLink } from "./player-link";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const currentRole = (session?.user as { role?: string } | undefined)?.role;

  const [users, unlinkedPlayers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { player: true },
    }),
    // Samo profili bez vlasnika — veza je 1:1.
    prisma.player.findMany({
      where: { userId: null },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, birthYear: true },
    }),
  ]);

  const pending = users.filter((u) => u.needsPlayerLink);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-1">
        Korisnici i uloge
      </h2>
      {currentRole !== "ADMIN" && (
        <p className="mb-4 rounded-md bg-gold/10 px-3 py-2 text-sm text-navy">
          Samo administratori mogu mijenjati uloge — možeš pregledati listu,
          ali izmjene su onemogućene za tvoj račun.
        </p>
      )}

      {pending.length > 0 && (
        <p className="mb-4 rounded-md border border-gold/40 bg-gold/5 px-3 py-2.5 text-sm text-navy">
          {pending.length === 1
            ? "Jedan račun čeka povezivanje s igračkim profilom."
            : `${pending.length} računa čeka povezivanje s igračkim profilom.`}{" "}
          Povezivanje potvrdi tek kad si siguran tko je osoba — ime i godište
          javni su podaci.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Igrač</th>
              <th className="px-4 py-3">Uloga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-navy">{u.email}</td>
                <td className="px-4 py-3">
                  <PlayerLink
                    userId={u.id}
                    linkedName={
                      u.player ? `${u.player.lastName} ${u.player.firstName}` : null
                    }
                    claimedName={u.claimedName}
                    claimedBirthYear={u.claimedBirthYear}
                    needsLink={u.needsPlayerLink}
                    suggestedPlayerId={u.pendingPlayerId}
                    players={unlinkedPlayers}
                  />
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={u.id}
                    currentRoleValue={u.role}
                    disabled={currentRole !== "ADMIN"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
