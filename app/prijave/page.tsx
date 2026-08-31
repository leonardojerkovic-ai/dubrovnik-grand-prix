import { prisma } from "@/lib/prisma";
import { getCurrentPlayer } from "@/lib/current-player";
import { RegisterButton } from "./register-button";

export default async function PrijavePage() {
  const player = await getCurrentPlayer();

  const tournaments = await prisma.tournament.findMany({
    where: { status: "PRIJAVE_OTVORENE" },
    orderBy: { date: "asc" },
    include: {
      season: true,
      registrations: player
        ? { where: { playerId: player.id, status: "PRIJAVLJEN" } }
        : false,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        Prijave na turnire
      </h1>

      {tournaments.length === 0 && (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Trenutno nema turnira otvorenih za prijavu.
        </p>
      )}

      <div className="grid gap-3">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-navy/10 bg-white px-4 py-4"
          >
            <div>
              <p className="font-semibold text-navy">{t.name}</p>
              <p className="text-sm text-ink/60">
                {t.date.toLocaleDateString("hr-HR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                ·{" "}
                <span className={t.season.system === "AKADEMIJA" ? "text-academy" : ""}>
                  {t.season.system === "GP" ? "Dubrovnik GP" : "GP Akademije"}
                </span>{" "}
                {t.season.yearLabel}
              </p>
            </div>
            <RegisterButton
              tournamentId={t.id}
              isLoggedIn={Boolean(player)}
              isRegistered={
                Array.isArray(t.registrations) && t.registrations.length > 0
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
