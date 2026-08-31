import { prisma } from "@/lib/prisma";

const CATEGORY_LABELS: Record<string, string> = {
  PRAVILNIK: "Pravilnici",
  ZAPISNIK: "Zapisnici",
  OSTALO: "Ostalo",
};

export default async function DokumentiPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { season: true },
  });

  const grouped = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    (acc[doc.category] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">
        Dokumenti
      </h1>

      {documents.length === 0 && (
        <p className="text-ink/60">Još nema objavljenih dokumenata.</p>
      )}

      <div className="grid gap-8">
        {Object.entries(grouped).map(([category, docs]) => (
          <section key={category}>
            <h2 className="font-display text-lg font-bold text-navy mb-3">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 hover:bg-sky-light/40"
                  >
                    <span className="font-medium text-navy">{doc.title}</span>
                    <span className="text-xs text-ink/50">
                      {doc.season ? `sezona ${doc.season.yearLabel}` : ""} ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
