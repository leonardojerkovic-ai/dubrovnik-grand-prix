import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { needsGuardian, SELF_ACCOUNT_AGE } from "@/lib/guardian-rules";
import { AddGuardianshipForm } from "./add-form";
import { RemoveGuardianshipButton } from "./remove-button";

/**
 * Pregled skrbništava, s naglaskom na onima koja treba razriješiti.
 *
 * Veza NE prestaje sama od sebe kad dijete napuni 18 — prekid usred sezone
 * zatekao bi ga bez pristupa. Umjesto toga se ovdje pojavi na popisu, pa se
 * razrješava od slučaja do slučaja.
 */
export default async function GuardianshipsPage() {
  const [accountsRaw, childrenRaw] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        player: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.player.findMany({
      where: { deceased: false },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, birthYear: true },
    }),
  ]);

  const accounts = accountsRaw.map((u) => ({
    id: u.id,
    label: u.player
      ? `${u.email} — ${u.player.lastName} ${u.player.firstName}`
      : u.email,
  }));

  // U izbor ulaze samo igrači kojima račun vodi netko drugi.
  const childOptions = childrenRaw
    .filter((p) => needsGuardian(p.birthYear))
    .map((p) => ({
      id: p.id,
      label: `${p.lastName} ${p.firstName} (${p.birthYear}.)`,
    }));

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

  // Igrači koji su dorasli vlastitom računu — skrbništvo im više nije nužno.
  const adults = links.filter((l) => !needsGuardian(l.player.birthYear));
  const minors = links.filter((l) => needsGuardian(l.player.birthYear));

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-navy mb-1">
        Skrbništva
      </h2>
      <p className="mb-5 max-w-2xl text-sm text-ink/60">
        Roditelji i skrbnici koji upravljaju profilima djece. Vezu može
        uspostaviti roditelj sam, upisom pristupnog koda djeteta, ili je ovdje
        dodaješ izravno — korisno kad roditelj i sam igra, pa već ima račun.
      </p>

      <section className="mb-8 rounded-lg border border-navy/10 bg-white px-4 py-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">
          Dodaj skrbništvo
        </h3>
        <AddGuardianshipForm accounts={accounts} childOptions={childOptions} />
        <p className="mt-3 text-xs text-ink/50">
          Ponuđeni su samo igrači mlađi od {SELF_ACCOUNT_AGE} godina. Isto
          dijete može voditi više skrbnika, primjerice oba roditelja.
        </p>
      </section>

      {adults.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold text-crimson">
            Mogu voditi vlastiti račun ({adults.length})
          </h3>
          <p className="mb-3 text-sm text-ink/60">
            Ovi igrači imaju {SELF_ACCOUNT_AGE} godina ili više. Razmisli
            treba li im izdati vlastiti pristupni kod i ukloniti skrbništvo —
            veza se ne prekida sama, da nikoga ne zatekne usred sezone.
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
                <span className="flex items-center gap-3 text-ink/60">
                  {l.guardian.email}
                  <RemoveGuardianshipButton
                    linkId={l.id}
                    label={`${l.player.lastName} ${l.player.firstName}`}
                  />
                </span>
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
              <span className="flex items-center gap-3 text-ink/60">
                {l.guardian.email}
                <RemoveGuardianshipButton
                  linkId={l.id}
                  label={`${l.player.lastName} ${l.player.firstName}`}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
