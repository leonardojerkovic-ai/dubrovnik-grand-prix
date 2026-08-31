import { prisma } from "@/lib/prisma";
import { createDocument, deleteDocument } from "./actions";
import { DocumentForm } from "./document-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const CATEGORY_LABELS: Record<string, string> = {
  PRAVILNIK: "Pravilnik",
  ZAPISNIK: "Zapisnik",
  OSTALO: "Ostalo",
};

export default async function AdminDocumentsPage() {
  const [documents, seasons] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { season: true },
    }),
    prisma.season.findMany({
      orderBy: [{ system: "asc" }, { yearLabel: "desc" }],
      select: { id: true, yearLabel: true, system: true },
    }),
  ]);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Dokumenti ({documents.length})
      </h2>

      <div className="mb-8 rounded-lg border border-navy/10 bg-white p-4">
        <DocumentForm action={createDocument} seasons={seasons} />
      </div>

      <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Naziv</th>
              <th className="px-4 py-3">Kategorija</th>
              <th className="px-4 py-3">Sezona</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {documents.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {d.title} ↗
                  </a>
                </td>
                <td className="px-4 py-3">{CATEGORY_LABELS[d.category]}</td>
                <td className="px-4 py-3 text-ink/60">
                  {d.season?.yearLabel ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteDocument(d.id);
                    }}
                  >
                    <ConfirmDeleteButton
                      confirmText={`Obrisati dokument "${d.title}"?`}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/50">
                  Još nema dodanih dokumenata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
