import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
              <Link
                href={`/turniri/${a.tournament.id}`}
                className="text-sm text-navy underline"
              >
                Pogledaj turnir: {a.tournament.name} →
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
