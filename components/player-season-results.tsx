import type { ProfileResult, ProfileSeason } from "@/lib/players/profile";

const TEMPO_LABEL: Record<string, string> = {
  STANDARD: "standard",
  RAPID: "rapid",
  BLITZ: "blitz",
};

const LEVEL_LABEL: Record<string, string> = {
  KLUPSKA: "klupska",
  NATJECATELJSKA: "natjecateljska",
  VRHUNSKA: "vrhunska",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

function num(value: unknown): string | null {
  return typeof value === "number" ? String(value).replace(".", ",") : null;
}

/** Razlaganje faktora iz snapshota — ono što daje odgovor na "zašto toliko". */
function Breakdown({ snapshot }: { snapshot: Record<string, unknown> }) {
  const isGp = snapshot.system === "GP";

  return (
    <div className="mt-2 rounded-md bg-navy px-3 py-2.5 text-xs leading-relaxed text-sky-light">
      <div className="mb-1 text-white">
        {isGp
          ? "100 × omjer × F_N × F_R × F_C × F_T"
          : "100 × omjer × F_N"}
      </div>
      <div>
        {num(snapshot.n)} igrača, {num(snapshot.r)}. mjesto → omjer{" "}
        <span className="text-white">{num(snapshot.ratio)}</span>
      </div>
      <div>
        F_N <span className="text-white">{num(snapshot.fn)}</span>
        {isGp && (
          <>
            {" · "}F_R <span className="text-white">{num(snapshot.fr)}</span>
            {typeof snapshot.averageRating === "number" && (
              <span className="text-sky-light/70">
                {" "}
                (prosjek {Math.round(snapshot.averageRating)})
              </span>
            )}
            {" · "}F_C <span className="text-white">{num(snapshot.fc)}</span>
            {" · "}F_T <span className="text-white">{num(snapshot.ft)}</span>
          </>
        )}
      </div>
      <div>
        {isGp && (
          <>
            umnožak <span className="text-white">{num(snapshot.product)}</span> →{" "}
          </>
        )}
        <span className="text-gold">{num(snapshot.points)} bodova</span>
      </div>
      {typeof snapshot.ruleVersion === "string" && (
        <div className="mt-1 text-sky-light/60">
          Pravilnik {snapshot.ruleVersion}
        </div>
      )}
    </div>
  );
}

function ResultRow({ result }: { result: ProfileResult }) {
  const dimmed = result.status !== "counted";

  const meta = [
    formatDate(result.date),
    TEMPO_LABEL[result.tempo] ?? result.tempo.toLowerCase(),
    result.level ? LEVEL_LABEL[result.level] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const note =
    result.status === "discarded"
      ? "odbačen — izvan kvote"
      : result.status === "outside"
        ? "ne ulazi u ovu ljestvicu"
        : result.isFinal
          ? "zaštićen rezultat"
          : null;

  return (
    <div
      className={`border-t border-navy/10 px-4 py-3 ${
        result.isFinal && !dimmed ? "bg-gold/5" : ""
      } ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink">
            {result.isFinal && !dimmed && (
              <span aria-hidden className="mr-1.5 text-gold">
                ●
              </span>
            )}
            <span className={dimmed ? "line-through" : ""}>
              {result.tournamentName}
            </span>
          </p>
          <p className="text-xs text-ink/50">
            {meta}
            {note ? ` · ${note}` : ""}
          </p>
        </div>
        <span className="w-12 text-right text-sm text-ink/60">
          {result.rank}.
        </span>
        <span className="w-14 text-right font-mono text-sm font-medium text-navy">
          {result.gpPoints ?? "—"}
        </span>
      </div>

      {result.snapshot && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-sky hover:text-navy">
            Kako je izračunato
          </summary>
          <Breakdown snapshot={result.snapshot} />
        </details>
      )}
    </div>
  );
}

export function PlayerSeasonResults({ season }: { season: ProfileSeason }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-navy">
          {season.yearLabel}
          <span className="ml-2 text-sm font-normal text-ink/50">
            {season.standingLabel}
          </span>
        </h2>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-paper px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">
            Ukupno
          </p>
          <p className="font-mono text-xl font-semibold text-navy">
            {season.total}
          </p>
        </div>
        <div className="rounded-lg bg-paper px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">
            Turnira
          </p>
          <p className="font-mono text-xl font-semibold text-navy">
            {season.playedCount}
          </p>
        </div>
        <div className="rounded-lg bg-paper px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">
            {season.quota === null ? "Broji se" : "Kvota"}
          </p>
          <p className="font-mono text-xl font-semibold text-navy">
            {season.quota ?? 4}
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-ink/50">
        {season.system === "GP" ? (
          <>
            U zbroj ulazi {season.quota} najboljih redovnih rezultata (čl. 16) i
            rezultat Finala, koji je zaštićen od odbacivanja (čl. 17). Ostali
            rezultati ostaju evidentirani.
          </>
        ) : (
          <>
            U zbroj ulaze najbolja 4 rezultata iz kvalifikacijske serije i
            rezultat Prvenstva Akademije, koji se ne može odbaciti (čl. 14).
          </>
        )}
      </p>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <div className="flex bg-navy/5 px-4 py-2 text-[10px] uppercase tracking-wide text-ink/60">
          <span className="flex-1">Turnir</span>
          <span className="w-12 text-right">Mjesto</span>
          <span className="w-14 text-right">Bodovi</span>
        </div>
        {season.results.map((r) => (
          <ResultRow key={r.tournamentId} result={r} />
        ))}
      </div>
    </section>
  );
}
