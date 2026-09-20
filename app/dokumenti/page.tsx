import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  documentStatus,
  formatDate,
  statusLabel,
  type DocumentStatus,
} from "@/lib/documents/status";

/**
 * Podaci se mijenjaju iz admina i iz vanjskih poslova (uvoz FIDE rejtinga
 * preko GitHub Actionsa), pa se stranica osvježava i vremenski, ne samo
 * pozivom iz akcije. Minuta je dovoljno kratko da nitko ne primijeti
 * zastoj, a dovoljno dugo da se ne gubi smisao predmemorije.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dokumenti",
  description: "Pravilnici i službeni dokumenti Šahovskog kluba Dubrovnik.",
};

const CATEGORY_LABELS: Record<string, string> = {
  PRAVILNIK: "Pravilnici",
  ZAPISNIK: "Zapisnici",
  OSTALO: "Ostalo",
};

const STATUS_CLASSES: Record<DocumentStatus, string> = {
  NA_SNAZI: "bg-academy/10 text-academy",
  USKORO: "bg-navy/10 text-navy",
  ARHIVA: "bg-ink/10 text-ink/60",
};

function StatusBadge({
  status,
  startDate,
}: {
  status: DocumentStatus;
  startDate: Date;
}) {
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status]}`}
    >
      {statusLabel(status, startDate)}
    </span>
  );
}

export default async function DokumentiPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { season: true },
  });

  const grouped = documents.reduce<Record<string, typeof documents>>(
    (acc, doc) => {
      (acc[doc.category] ??= []).push(doc);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Dokumenti
      </h1>
      <p className="mb-8 max-w-prose text-sm text-ink/70">
        Pravilnici po kojima se boduju natjecanja kluba. Uz svaki stoji verzija
        i od kada vrijedi — rezultat se uvijek tumači po pravilniku koji je bio
        na snazi na dan turnira.
      </p>

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
              {docs.map((doc) => {
                const status = doc.season
                  ? documentStatus(doc.season)
                  : null;
                const meta = [
                  doc.season?.rulebookVersion ?? null,
                  doc.season
                    ? `vrijedi od ${formatDate(doc.season.startDate)}`
                    : null,
                  "PDF",
                ].filter(Boolean);

                return (
                  <li key={doc.id}>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-sky-light/40"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-navy">
                          {doc.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink/70">
                          {meta.join(" · ")}
                        </span>
                      </span>
                      {status && doc.season && (
                        <StatusBadge
                          status={status}
                          startDate={doc.season.startDate}
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
