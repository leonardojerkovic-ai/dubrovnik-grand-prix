import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PlayerName } from "@/components/player-name";

export const metadata: Metadata = {
  title: "Igrači",
  description:
    "Popis članova Šahovskog kluba Dubrovnik s rejtinzima i poveznicama na profile.",
};

type SortKey = "ime" | "standard" | "rapid" | "blitz";
type SortDir = "asc" | "desc";

const SORT_KEYS: SortKey[] = ["ime", "standard", "rapid", "blitz"];

/** Zadani smjer po stupcu: imena rastuće, rejtinzi padajuće. */
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  ime: "asc",
  standard: "desc",
  rapid: "desc",
  blitz: "desc",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: { q?: string; sort?: string; dir?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";

  const sort: SortKey = SORT_KEYS.includes(searchParams?.sort as SortKey)
    ? (searchParams!.sort as SortKey)
    : "ime";
  const dir: SortDir =
    searchParams?.dir === "asc" || searchParams?.dir === "desc"
      ? searchParams.dir
      : DEFAULT_DIR[sort];

  const players = await prisma.player.findMany({
    where: {
      // Javno se prikazuju samo članovi Kluba — jednako načelo kao na
      // ljestvicama (čl. 4). Nečlanovi mogu nastupati na turnirima, ali
      // njihovi se profili ne objavljuju.
      isClubMember: true,
      // Preminuli igrači ne stoje na popisu, ali im profil i rezultati
      // ostaju dostupni preko turnira i ljestvica.
      deceased: false,
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

  /**
   * Sortiranje ide u kodu, ne u upitu: igrači bez rejtinga u nekom tempu
   * moraju uvijek ostati na dnu, bez obzira na smjer — inače bi pri
   * rastućem redoslijedu prazna polja zauzela vrh tablice. Popis je malen,
   * pa trošak ne postoji.
   */
  const collator = new Intl.Collator("hr");

  const sorted = [...players].sort((a, b) => {
    if (sort === "ime") {
      const byLast = collator.compare(a.lastName, b.lastName);
      const cmp = byLast !== 0 ? byLast : collator.compare(a.firstName, b.firstName);
      return dir === "asc" ? cmp : -cmp;
    }

    const ra = a.ratingsCurrent?.[sort] ?? null;
    const rb = b.ratingsCurrent?.[sort] ?? null;

    if (ra === null && rb === null) {
      return collator.compare(a.lastName, b.lastName);
    }
    if (ra === null) return 1;
    if (rb === null) return -1;

    return dir === "asc" ? ra - rb : rb - ra;
  });

  /** Poveznica zaglavlja: isti stupac okreće smjer, novi kreće od zadanog. */
  const sortHref = (key: SortKey) => {
    const nextDir =
      sort === key ? (dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[key];
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("sort", key);
    params.set("dir", nextDir);
    return `/igraci?${params.toString()}`;
  };

  const arrow = (key: SortKey) =>
    sort === key ? (dir === "asc" ? "\u2191" : "\u2193") : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Igrači</h1>
      <p className="mb-5 text-sm text-ink/60">
        Članovi Šahovskog kluba Dubrovnik. Klikni na ime za profil s
        rezultatima i razlaganjem bodova.
      </p>

      <form method="get" className="mb-5 flex gap-2">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
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
                {(
                  [
                    ["ime", "Igrač", "left"],
                    ["standard", "Standard", "right"],
                    ["rapid", "Rapid", "right"],
                    ["blitz", "Blitz", "right"],
                  ] as const
                ).map(([key, label, align]) => (
                  <th
                    key={key}
                    className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}
                    aria-sort={
                      sort === key
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <Link
                      href={sortHref(key)}
                      className={`inline-flex items-center gap-1 hover:text-navy ${
                        sort === key ? "text-navy" : ""
                      }`}
                    >
                      {label}
                      <span aria-hidden className="text-[10px]">
                        {arrow(key)}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-navy">
                    <PlayerName
                      id={p.id}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      title={p.title}
                    />
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      sort === "standard" ? "text-navy" : "text-ink/70"
                    }`}
                  >
                    {p.ratingsCurrent?.standard ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      sort === "rapid" ? "text-navy" : "text-ink/70"
                    }`}
                  >
                    {p.ratingsCurrent?.rapid ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      sort === "blitz" ? "text-navy" : "text-ink/70"
                    }`}
                  >
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
