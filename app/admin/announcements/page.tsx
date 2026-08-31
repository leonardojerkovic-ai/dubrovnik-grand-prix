import { prisma } from "@/lib/prisma";
import { createAnnouncement, deleteAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function AdminAnnouncementsPage() {
  const [announcements, tournaments, seasons] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      include: { tournament: true, season: true },
    }),
    prisma.tournament.findMany({
      orderBy: { date: "desc" },
      select: { id: true, name: true },
    }),
    prisma.season.findMany({
      orderBy: [{ system: "asc" }, { yearLabel: "desc" }],
      select: { id: true, yearLabel: true, system: true },
    }),
  ]);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Najave ({announcements.length})
      </h2>

      <div className="mb-8 rounded-lg border border-navy/10 bg-white p-4">
        <AnnouncementForm
          action={createAnnouncement}
          tournaments={tournaments}
          seasons={seasons}
        />
      </div>

      <div className="grid gap-3">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg border border-navy/10 bg-white p-4">
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-navy">{a.title}</p>
                <p className="text-xs text-ink/50">
                  {a.publishedAt.toLocaleDateString("hr-HR")}
                  {a.tournament && ` · ${a.tournament.name}`}
                  {a.season && ` · sezona ${a.season.yearLabel}`}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteAnnouncement(a.id);
                }}
              >
                <ConfirmDeleteButton confirmText={`Obrisati najavu "${a.title}"?`} />
              </form>
            </div>
            <p className="text-sm text-ink/70 whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
            Još nema objavljenih najava.
          </p>
        )}
      </div>
    </div>
  );
}
