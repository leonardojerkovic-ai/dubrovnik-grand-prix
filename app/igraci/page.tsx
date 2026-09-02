import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Igrači",
  description:
    "Popis članova Šahovskog kluba Dubrovnik s rejtinzima i poveznicama na profile.",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";

  const players = await prisma.player.findMany({
    where: {
      // Javno se prikazuju samo članovi Kluba — jednako načelo kao na
      // ljestvicama (čl. 4). Nečlanovi mogu nastupati na turnirima, ali
      // njihovi se profili ne objavljuju.
      isClubMember: true,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { ratingsCurrent: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Igrači</h1>
      <p className="mb-5 text-sm text-ink/60">
        Članovi Šahovskog kluba Dubrovnik. Klikni na ime za profil s
        rezultatima i razlaganjem bodova.
      </p>

      <form method="get" className="mb-5 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Pretraži po imenu ili prezimenu"
          className="input flex-1"
        />
        <button
          type="submit"
          className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-paper hover:bg-navy-light"
        >
          Traži
        </button>
        {q && (
          <Link
            href="/igraci"
            className="self-center text-sm text-crimson hover:underline"
          >
            Poništi
          </Link>
        )}
      </form>

      {players.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          {q
            ? `Nema igrača koji odgovaraju pojmu „${q}".`
            : "Još nema unesenih članova."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Igrač</th>
                <th className="px-4 py-3 text-right">Standard</th>
                <th className="px-4 py-3 text-right">Rapid</th>
                <th className="px-4 py-3 text-right">Blitz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-navy">
                    {p.title !== "NONE" && (
                      <span className="badge-title mr-2">{p.title}</span>
                    )}
                    <Link
                      href={`/igraci/${p.id}`}
                      className="hover:text-crimson hover:underline"
                    >
                      {p.lastName} {p.firstName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink/70">
                    {p.ratingsCurrent?.standard ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink/70">
                    {p.ratingsCurrent?.rapid ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink/70">
                    {p.ratingsCurrent?.blitz ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
