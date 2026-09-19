import Link from "next/link";

/**
 * Prvih nekoliko mjesta ljestvice, za naslovnicu.
 *
 * Naslov naslovnice obećava ljestvicu, pa je treba i pokazati — čovjek koji
 * se vraća na stranicu prvo želi vidjeti gdje je, a ne kad je idući turnir.
 * Puni poredak ostaje na svojoj stranici; ovdje stoji samo vrh, s izravnom
 * poveznicom.
 */

export interface StandingsPreviewRow {
  playerId: string;
  name: string;
  title: string;
  total: number;
}

export function StandingsPreview({
  heading,
  seasonLabel,
  href,
  rows,
  accent = "gp",
}: {
  heading: string;
  seasonLabel: string;
  href: string;
  rows: StandingsPreviewRow[];
  accent?: "gp" | "akademija";
}) {
  if (rows.length === 0) return null;

  const badgeClass =
    accent === "akademija"
      ? "badge-title bg-academy/10 text-academy"
      : "badge-title";

  return (
    <section className="rounded-lg border border-navy/10 bg-white">
      <header className="flex items-baseline justify-between gap-3 border-b border-navy/10 px-4 py-3">
        <div>
          <h3 className="font-display font-bold text-navy">{heading}</h3>
          <span className={badgeClass}>Sezona {seasonLabel}</span>
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-navy hover:underline"
        >
          Cijela ljestvica →
        </Link>
      </header>

      <ol className="divide-y divide-navy/[0.07]">
        {rows.map((row, index) => {
          const place = index + 1;
          return (
            <li
              key={row.playerId}
              className="flex items-center gap-3 px-4 py-2 text-sm"
            >
              <span
                className={`w-5 shrink-0 text-right font-mono tabular-nums ${
                  place === 1 ? "font-bold text-navy" : "text-ink/45"
                }`}
              >
                {place}
              </span>
              <Link
                href={`/igraci/${row.playerId}`}
                className="min-w-0 flex-1 truncate text-navy hover:underline"
              >
                {row.title !== "NONE" && (
                  <span className="mr-1 text-[10px] font-semibold text-ink/50">
                    {row.title}
                  </span>
                )}
                {row.name}
              </Link>
              <span className="shrink-0 font-mono tabular-nums font-semibold text-navy">
                {row.total}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
