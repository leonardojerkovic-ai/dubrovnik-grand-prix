import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deletePlayer } from "./actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { ratingsCurrent: true },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">
          Igrači ({players.length})
        </h2>
        <Link
          href="/admin/players/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light transition-colors"
        >
          + Novi igrač
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Ime i prezime</th>
              <th className="px-4 py-3">Titula</th>
              <th className="px-4 py-3">FIDE ID</th>
              <th className="px-4 py-3 font-mono">Standard</th>
              <th className="px-4 py-3">Član</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  {p.lastName} {p.firstName}
                </td>
                <td className="px-4 py-3">
                  {p.title !== "NONE" ? (
                    <span className="badge-title">{p.title}</span>
                  ) : (
                    <span className="text-ink/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-ink/70">
                  {p.fideId ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {p.ratingsCurrent?.standard ?? 0}
                </td>
                <td className="px-4 py-3">
                  {p.isClubMember ? (
                    <span className="text-academy">DA</span>
                  ) : (
                    <span className="text-ink/40">NE</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/players/${p.id}`}
                    className="mr-3 text-navy hover:text-crimson"
                  >
                    Uredi
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deletePlayer(p.id);
                    }}
                    className="inline"
                  >
                    <ConfirmDeleteButton
                      confirmText={`Obrisati igrača ${p.firstName} ${p.lastName}? Ova radnja se ne može poništiti.`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  Još nema unesenih igrača.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
