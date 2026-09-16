import { prisma } from "@/lib/prisma";
import { createAnnouncement, deleteAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";
import { AnnouncementRow } from "./announcement-row";
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
          <AnnouncementRow
            key={a.id}
            id={a.id}
            title={a.title}
            body={a.body}
            meta={[
              a.publishedAt.toLocaleDateString("hr-HR"),
              a.tournament?.name,
              a.season ? `sezona ${a.season.yearLabel}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            tournamentId={a.tournamentId}
            seasonId={a.seasonId}
            tournaments={tournaments}
            seasons={seasons}
            deleteButton={
              <form
                action={async () => {
                  "use server";
                  await deleteAnnouncement(a.id);
                }}
              >
                <ConfirmDeleteButton confirmText={`Obrisati najavu "${a.title}"?`} />
              </form>
            }
          />
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
