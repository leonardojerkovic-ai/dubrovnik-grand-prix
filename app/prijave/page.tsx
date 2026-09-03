import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RegisterButton } from "@/components/register-button";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Prijave na turnire",
  description: "Prijavi se na turnire Dubrovnik Grand Prixa i GP Akademije.",
};

export default async function PrijavePage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: "PRIJAVE_OTVORENE" },
    orderBy: { date: "asc" },
    include: { season: true },
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
            <RegisterButton tournamentId={t.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
