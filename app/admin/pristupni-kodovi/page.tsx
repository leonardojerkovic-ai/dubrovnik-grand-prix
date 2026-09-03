import { prisma } from "@/lib/prisma";
import { CodeRow } from "./code-row";

function fmt(d: Date | null): string | null {
  return d
    ? new Intl.DateTimeFormat("hr-HR", { dateStyle: "short" }).format(d)
    : null;
}

export default async function LinkCodesPage() {
  const players = await prisma.player.findMany({
    where: { userId: null, deceased: false },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      linkCodeHash: true,
      linkCodeIssuedAt: true,
      linkCodeUsedAt: true,
    },
  });

  const linkedCount = await prisma.player.count({
    where: { userId: { not: null } },
  });

  const withCode = players.filter((p) => p.linkCodeHash).length;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-navy mb-1">
        Pristupni kodovi
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-ink/60">
        Kod dokazuje da je osoba ta koja tvrdi da jest, pa se njezin račun pri
        registraciji odmah povezuje s igračkim profilom — bez ručnog
        odobravanja. Prikazuje se samo jednom, pri izdavanju; u bazi ostaje
        samo njegov otisak.
      </p>

      <div className="mb-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md bg-paper px-3 py-2">
          Povezanih računa: <strong className="text-navy">{linkedCount}</strong>
        </span>
        <span className="rounded-md bg-paper px-3 py-2">
          Bez računa: <strong className="text-navy">{players.length}</strong>
        </span>
        <span className="rounded-md bg-paper px-3 py-2">
          Izdanih kodova: <strong className="text-navy">{withCode}</strong>
        </span>
      </div>

      {players.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-ink/50">
          Svi igrači imaju povezan korisnički račun.
        </p>
      ) : (
        <div className="rounded-lg border border-navy/10 bg-white px-3 py-1">
          {players.map((p) => (
            <CodeRow
              key={p.id}
              playerId={p.id}
              playerName={`${p.lastName} ${p.firstName}`}
              hasCode={Boolean(p.linkCodeHash)}
              issuedAt={fmt(p.linkCodeIssuedAt)}
              usedAt={fmt(p.linkCodeUsedAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
