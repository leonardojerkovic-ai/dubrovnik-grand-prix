import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteSeason } from "./actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function AdminSeasonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ system: "asc" }, { startDate: "desc" }],
    include: { _count: { select: { tournaments: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">
          Sezone ({seasons.length})
        </h2>
        <Link
          href="/admin/seasons/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-light transition-colors"
        >
          + Nova sezona
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Sustav</th>
              <th className="px-4 py-3">Oznaka</th>
              <th className="px-4 py-3">Razdoblje</th>
              <th className="px-4 py-3">Turniri</th>
              <th className="px-4 py-3">Aktivna</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {seasons.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <span className={s.system === "AKADEMIJA" ? "text-academy" : "text-navy"}>
                    {s.system === "GP" ? "Dubrovnik GP" : "GP Akademije"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-navy">{s.yearLabel}</td>
                <td className="px-4 py-3 text-ink/70">
                  {s.startDate.toLocaleDateString("hr-HR")} –{" "}
                  {s.endDate.toLocaleDateString("hr-HR")}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {s._count.tournaments}
                </td>
                <td className="px-4 py-3">
                  {s.isActive ? (
                    <span className="badge-title">Aktivna</span>
                  ) : (
                    <span className="text-ink/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/seasons/${s.id}`}
                    className="mr-3 text-navy hover:text-crimson"
                  >
                    Uredi
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteSeason(s.id);
                    }}
                    className="inline"
                  >
                    <ConfirmDeleteButton
                      confirmText={`Obrisati sezonu ${s.yearLabel}? Ovo briše i sve njene turnire i rezultate. Ova radnja se ne može poništiti.`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {seasons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  Još nema unesenih sezona.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
