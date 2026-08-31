import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteTournament } from "./actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const STATUS_LABELS: Record<string, string> = {
  NAJAVA: "Najava",
  PRIJAVE_OTVORENE: "Prijave otvorene",
  U_TIJEKU: "U tijeku",
  ZAVRSEN: "Završen",
};

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: "desc" },
    include: { season: true, _count: { select: { results: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">
          Turniri ({tournaments.length})
        </h2>
        <Link
          href="/admin/tournaments/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light transition-colors"
        >
          + Novi turnir
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Naziv</th>
              <th className="px-4 py-3">Sezona</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rezultati</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {tournaments.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  {t.name}
                  {t.isFinal && <span className="badge-title ml-2">Finale</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      t.season.system === "AKADEMIJA" ? "text-academy" : "text-navy"
                    }
                  >
                    {t.season.system === "GP" ? "Dubrovnik GP" : "Akademija"}
                  </span>{" "}
                  {t.season.yearLabel}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {t.date.toLocaleDateString("hr-HR")}
                </td>
                <td className="px-4 py-3">{STATUS_LABELS[t.status]}</td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {t._count.results}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/tournaments/${t.id}/prijave`}
                    className="mr-3 text-navy hover:text-crimson"
                  >
                    Prijave
                  </Link>
                  <Link
                    href={`/admin/tournaments/${t.id}/results`}
                    className="mr-3 text-navy hover:text-crimson"
                  >
                    Rezultati
                  </Link>
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="mr-3 text-navy hover:text-crimson"
                  >
                    Uredi
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteTournament(t.id);
                    }}
                    className="inline"
                  >
                    <ConfirmDeleteButton
                      confirmText={`Obrisati turnir "${t.name}"? Ovo briše i sve njegove rezultate. Ova radnja se ne može poništiti.`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  Još nema unesenih turnira.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
