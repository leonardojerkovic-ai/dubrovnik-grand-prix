import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerProfile } from "@/lib/players/profile";
import { RatingChart } from "@/components/rating-chart";
import { PlayerSeasonResults } from "@/components/player-season-results";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const player = await getPlayerProfile(params.id);
  if (!player) return {};
  const name = `${player.firstName} ${player.lastName}`;
  return {
    title: `${name} — profil igrača`,
    description: `Rezultati i GP bodovi igrača ${name} u Dubrovnik Grand Prixu.`,
  };
}

function Rating({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-paper px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-ink/50">{label}</p>
      <p className="font-mono text-xl font-semibold text-navy">
        {value ?? "—"}
      </p>
    </div>
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const player = await getPlayerProfile(params.id);
  if (!player) notFound();

  const memberSinceYear = player.memberSince?.getFullYear();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 rounded-lg bg-navy p-5">
        <div className="flex items-baseline gap-2">
          {player.title !== "NONE" && (
            <span className="text-xs font-semibold tracking-widest text-gold">
              {player.title}
            </span>
          )}
          <h1 className="font-display text-2xl font-bold text-white">
            {player.firstName} {player.lastName}
          </h1>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-sky-light">
          {player.fideId ? `FIDE ID ${player.fideId} · ` : ""}
          godište {player.birthYear}
        </p>

        {player.isClubMember && (
          <p className="mt-2">
            <span className="rounded bg-gold px-2 py-1 text-[10px] font-medium text-navy-dark">
              Član ŠK Dubrovnik
              {memberSinceYear ? ` od ${memberSinceYear}.` : ""}
            </span>
          </p>
        )}
      </header>

      <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-navy/10 bg-navy/10">
        <Rating label="Standard" value={player.current.standard} />
        <Rating label="Rapid" value={player.current.rapid} />
        <Rating label="Blitz" value={player.current.blitz} />
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-navy">
          Kretanje rejtinga
        </h2>
        <RatingChart history={player.ratingHistory} />
      </div>

      {player.seasons.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Igrač još nema unesenih rezultata.
        </p>
      ) : (
        player.seasons.map((season) => (
          <PlayerSeasonResults key={season.seasonId} season={season} />
        ))
      )}
    </div>
  );
}
