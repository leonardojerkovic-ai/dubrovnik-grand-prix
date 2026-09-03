import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isMinorByBirthYear } from "@/lib/guardian-rules";

/**
 * Pregled skrbništava, s naglaskom na onima koja treba razriješiti.
 *
 * Veza NE prestaje sama od sebe kad dijete napuni 18 — prekid usred sezone
 * zatekao bi ga bez pristupa. Umjesto toga se ovdje pojavi na popisu, pa se
 * razrješava od slučaja do slučaja.
 */
export default async function GuardianshipsPage() {
  const links = await prisma.guardianLink.findMany({
    orderBy: [{ player: { lastName: "asc" } }],
    select: {
      id: true,
      createdAt: true,
      guardian: { select: { email: true } },
      player: {
        select: { id: true, firstName: true, lastName: true, birthYear: true },
      },
    },
  });

  const adults = links.filter((l) => !isMinorByBirthYear(l.player.birthYear));
  const minors = links.filter((l) => isMinorByBirthYear(l.player.birthYear));

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-navy mb-1">
        Skrbništva
      </h2>
      <p className="mb-5 max-w-2xl text-sm text-ink/60">
        Roditelji i skrbnici koji upravljaju profilima djece. Veza se
        uspostavlja upisom pristupnog koda i vrijedi dok se ne ukloni.
      </p>

      {adults.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold text-crimson">
            Postali punoljetni ({adults.length})
          </h3>
          <p className="mb-3 text-sm text-ink/60">
            Ovi igrači više nisu maloljetni. Razmisli treba li im izdati
            vlastiti pristupni kod i ukloniti skrbništvo — veza se ne prekida
            sama, da nikoga ne zatekne usred sezone.
          </p>
          <div className="divide-y divide-navy/[0.07] rounded-lg border border-crimson/30 bg-white">
            {adults.map((l) => (
              <div key={l.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <Link
                  href={`/igraci/${l.player.id}`}
                  className="font-medium text-navy hover:text-crimson hover:underline"
                >
                  {l.player.lastName} {l.player.firstName} ({l.player.birthYear}.)
                </Link>
                <span className="text-ink/60">{l.guardian.email}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <h3 className="mb-2 text-sm font-semibold text-navy">
        Aktivna skrbništva ({minors.length})
      </h3>
      {minors.length === 0 ? (
        <p className="rounded-lg border border-navy/10 bg-white px-4 py-8 text-center text-sm text-ink/50">
          Nema zabilježenih skrbništava.
        </p>
      ) : (
        <div className="divide-y divide-navy/[0.07] rounded-lg border border-navy/10 bg-white">
          {minors.map((l) => (
            <div key={l.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <Link
                href={`/igraci/${l.player.id}`}
                className="font-medium text-navy hover:text-crimson hover:underline"
              >
                {l.player.lastName} {l.player.firstName} ({l.player.birthYear}.)
              </Link>
              <span className="text-ink/60">{l.guardian.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
