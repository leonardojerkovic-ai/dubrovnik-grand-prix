import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  NAJAVA: "Najava",
  PRIJAVE_OTVORENE: "Prijave otvorene",
  U_TIJEKU: "U tijeku",
  ZAVRSEN: "Završen",
};

const LEVEL_LABELS: Record<string, string> = {
  KLUPSKA: "Klupska",
  NATJECATELJSKA: "Natjecateljska",
  VRHUNSKA: "Vrhunska",
};

export default async function KalendarPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ system: "asc" }, { startDate: "desc" }],
    include: { tournaments: { orderBy: { date: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">
        Kalendar
      </h1>

      {seasons.length === 0 && (
        <p className="text-ink/60">Kalendar još nije objavljen.</p>
      )}

      <div className="grid gap-10">
        {seasons.map((season) => (
          <section key={season.id}>
            <h2 className="font-display text-lg font-bold text-navy mb-3">
              <span className={season.system === "AKADEMIJA" ? "text-academy" : ""}>
                {season.system === "GP" ? "Dubrovnik Grand Prix" : "GP Akademije"}
              </span>{" "}
              — sezona {season.yearLabel}
            </h2>

            {season.tournaments.length === 0 ? (
              <p className="text-sm text-ink/50">Nema unesenih turnira.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
                    <tr>
                      <th className="px-4 py-2">Naziv</th>
                      <th className="px-4 py-2">Datum</th>
                      <th className="px-4 py-2">Razina / tempo</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10">
                    {season.tournaments.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 font-medium text-navy">
                          {t.name}
                          {t.isFinal && <span className="badge-title ml-2">Finale</span>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {t.date.toLocaleDateString("hr-HR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {t.level ? `${LEVEL_LABELS[t.level]}, ` : ""}
                          {t.tempo === "STANDARD"
                            ? "standard"
                            : t.tempo === "RAPID"
                              ? "rapid"
                              : "blitz"}
                        </td>
                        <td className="px-4 py-3">{STATUS_LABELS[t.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
