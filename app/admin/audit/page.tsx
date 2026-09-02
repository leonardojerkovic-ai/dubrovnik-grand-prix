import { prisma } from "@/lib/prisma";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Dodano",
  UPDATE: "Izmijenjeno",
  DELETE: "Obrisano",
  RECALCULATE: "Preračunato",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-800",
  UPDATE: "bg-gold/20 text-navy",
  DELETE: "bg-crimson/10 text-crimson",
  RECALCULATE: "bg-navy/10 text-navy",
};

const PAGE_SIZE = 100;

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("hr-HR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: { entity?: string; actor?: string };
}) {
  const entity = searchParams?.entity;
  const actor = searchParams?.actor;

  const [entries, entities, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        entity: entity && entity.length > 0 ? entity : undefined,
        actorEmail: actor && actor.length > 0 ? actor : undefined,
      },
      orderBy: { at: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["actorEmail"],
      select: { actorEmail: true },
      orderBy: { actorEmail: "asc" },
    }),
  ]);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-1">
        Trag izmjena
      </h2>
      <p className="mb-4 text-sm text-ink/60">
        Zapis o svakoj izmjeni u adminu. Služi za razrješavanje prigovora na
        izračun (čl. 29). Zapisi se ne mogu mijenjati ni brisati.
      </p>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-medium text-navy">
          Vrsta podatka
          <select
            name="entity"
            defaultValue={entity ?? ""}
            className="rounded-md border border-navy/20 px-3 py-2 text-sm"
          >
            <option value="">Sve</option>
            {entities.map((e) => (
              <option key={e.entity} value={e.entity}>
                {e.entity}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-navy">
          Tko je mijenjao
          <select
            name="actor"
            defaultValue={actor ?? ""}
            className="rounded-md border border-navy/20 px-3 py-2 text-sm"
          >
            <option value="">Svi</option>
            {actors.map((a) => (
              <option key={a.actorEmail} value={a.actorEmail}>
                {a.actorEmail}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          Filtriraj
        </button>

        {(entity || actor) && (
          <a href="/admin/audit" className="text-sm text-crimson hover:underline">
            Poništi filtar
          </a>
        )}
      </form>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-6 text-sm text-ink/60">
          Nema zabilježenih izmjena
          {entity || actor ? " za odabrani filtar." : " — trag počinje od uvođenja ove funkcije."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Kada</th>
                <th className="px-4 py-3">Tko</th>
                <th className="px-4 py-3">Radnja</th>
                <th className="px-4 py-3">Što</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {entries.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-ink/60">
                    {formatDateTime(e.at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-navy">{e.actorEmail}</span>
                    <span className="block text-xs text-ink/50">{e.actorRole}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        ACTION_STYLES[e.action] ?? "bg-navy/10 text-navy"
                      }`}
                    >
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                    <span className="block text-xs text-ink/50 mt-1">{e.entity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-ink">{e.summary}</span>
                    {(e.before || e.after) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-ink/50 hover:text-navy">
                          Detalji
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded bg-navy/5 p-2 text-[11px] leading-relaxed text-ink/80">
                          {JSON.stringify({ prije: e.before, poslije: e.after }, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === PAGE_SIZE && (
        <p className="mt-3 text-xs text-ink/50">
          Prikazano zadnjih {PAGE_SIZE} zapisa. Suzi filtar za starije.
        </p>
      )}
    </div>
  );
}
