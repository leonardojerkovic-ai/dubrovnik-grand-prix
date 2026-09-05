import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Najave turnira",
  description: "Najave i obavijesti o turnirima Šahovskog kluba Dubrovnik.",
};

export default async function NajavePage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    include: { tournament: true, season: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">
        Najave turnira
      </h1>

      {announcements.length === 0 && (
        <p className="text-ink/60">Trenutno nema objavljenih najava.</p>
      )}

      <div className="grid gap-4">
        {announcements.map((a) => (
          <article key={a.id} className="rounded-lg border border-navy/10 bg-white p-5">
            <p className="mb-1 text-xs text-ink/50">
              {a.publishedAt.toLocaleDateString("hr-HR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h2 className="font-display text-lg font-bold text-navy mb-2">
              {a.title}
            </h2>
            <p className="text-sm text-ink/70 whitespace-pre-wrap mb-3">{a.body}</p>
            {a.tournament && (
              <div className="rounded-md bg-paper px-3 py-2.5">
                <Link
                  href={`/turniri/${a.tournament.id}`}
                  className="text-sm font-medium text-navy hover:text-crimson hover:underline"
                >
                  {a.tournament.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink/60">
                  {[
                    a.tournament.date.toLocaleDateString("hr-HR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }) + (a.tournament.startTime ? ` u ${a.tournament.startTime}` : ""),
                    a.tournament.venue,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {a.tournament.announcementUrl && (
                  <a
                    href={a.tournament.announcementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs font-medium text-navy underline hover:text-crimson"
                  >
                    Raspis turnira
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
