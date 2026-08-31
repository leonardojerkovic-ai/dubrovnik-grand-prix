import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  sortPlayersByRatingTitleSurname,
  type SortablePlayerEntry,
} from "@/lib/players/sort";

const LEVEL_LABELS: Record<string, string> = {
  KLUPSKA: "Klupska",
  NATJECATELJSKA: "Natjecateljska",
  VRHUNSKA: "Vrhunska",
};

const TEMPO_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  RAPID: "Rapid / ubrzani",
  BLITZ: "Blitz / brzopotezni",
};

function formatTimeControl(baseMinutes: number | null, incrementSeconds: number | null) {
  if (baseMinutes == null) return null;
  const inc = incrementSeconds ?? 0;
  return `${baseMinutes} min${inc > 0 ? ` + ${inc} sek/potez` : ""}`;
}

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      season: true,
      registrations: {
        where: { status: "PRIJAVLJEN" },
        include: { player: { include: { ratingsCurrent: true } } },
      },
    },
  });

  if (!tournament) notFound();

  const ratingField =
    tournament.tempo === "STANDARD"
      ? "standard"
      : tournament.tempo === "RAPID"
        ? "rapid"
        : "blitz";

  const entries: (SortablePlayerEntry & { id: string })[] =
    tournament.registrations.map((r) => ({
      id: r.player.id,
      firstName: r.player.firstName,
      lastName: r.player.lastName,
      title: r.player.title,
      rating: r.player.ratingsCurrent?.[ratingField] ?? null,
    }));

  const sortedPlayers = sortPlayersByRatingTitleSurname(entries);
  const timeControl = formatTimeControl(tournament.baseMinutes, tournament.incrementSeconds);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-2">
        <span
          className={`badge-title ${tournament.season.system === "AKADEMIJA" ? "bg-academy/15 text-academy" : ""}`}
        >
          {tournament.season.system === "GP" ? "Dubrovnik GP" : "GP Akademije"} — sezona{" "}
          {tournament.season.yearLabel}
        </span>
        {tournament.isFinal && <span className="badge-title ml-2">Finale</span>}
      </div>
      <h1 className="font-display text-2xl font-bold text-navy mb-4">
        {tournament.name}
      </h1>

      <dl className="mb-8 grid grid-cols-2 gap-4 rounded-lg border border-navy/10 bg-white p-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink/40">Datum</dt>
          <dd className="font-medium text-navy">
            {tournament.date.toLocaleDateString("hr-HR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </dd>
        </div>
        {tournament.level && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink/40">Razina</dt>
            <dd className="font-medium text-navy">{LEVEL_LABELS[tournament.level]}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink/40">Tempo</dt>
          <dd className="font-medium text-navy">{TEMPO_LABELS[tournament.tempo]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink/40">
            Vrijeme razmišljanja
          </dt>
          <dd className="font-medium text-navy font-mono">
            {timeControl ?? "nije objavljeno"}
          </dd>
        </div>
      </dl>

      <h2 className="font-display text-lg font-bold text-navy mb-3">
        Prijavljeni igrači ({sortedPlayers.length})
      </h2>

      {sortedPlayers.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Još nema prijava za ovaj turnir.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-4 py-2">Igrač</th>
                <th className="px-4 py-2 text-right font-mono">Rejting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {sortedPlayers.map((p, i) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-ink/50 font-mono">{i + 1}.</td>
                  <td className="px-4 py-2 font-medium text-navy">
                    {p.title !== "NONE" && (
                      <span className="badge-title mr-2">{p.title}</span>
                    )}
                    {p.lastName} {p.firstName}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {p.rating ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
