import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getManagedPlayers } from "@/lib/guardian";
import { isMinorByBirthYear } from "@/lib/guardian-rules";
import { AddChildForm } from "./add-child-form";
import { RemoveChildButton } from "./remove-child-button";

export const metadata: Metadata = { title: "Moji igrači" };

/** Ovisi o prijavljenom korisniku, pa se ne smije spremati u predmemoriju. */
export const dynamic = "force-dynamic";

export default async function MyPlayersPage() {
  const managed = await getManagedPlayers();
  if (managed.length === 0) {
    // Bez prijave nema što prikazati; getManagedPlayers vraća prazno i kad
    // korisnik nema nijedan profil, pa se u tom slučaju svejedno prikazuje
    // obrazac za dodavanje.
  }

  const self = managed.find((p) => p.isSelf);
  const children = managed.filter((p) => !p.isSelf);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-navy mb-1">
        Moji igrači
      </h1>
      <p className="mb-6 text-sm text-ink/60">
        Ovdje su profili kojima upravljaš — tvoj vlastiti i djeca za koju si
        upisao/la pristupni kod. Pri prijavi na turnir biraš za koga se
        prijavljuješ.
      </p>

      <div className="mb-8 divide-y divide-navy/[0.07] rounded-lg border border-navy/10 bg-white">
        {self && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <Link
                href={`/igraci/${self.id}`}
                className="font-medium text-navy hover:text-crimson hover:underline"
              >
                {self.lastName} {self.firstName}
              </Link>
              <p className="text-xs text-ink/50">tvoj profil · {self.birthYear}.</p>
            </div>
          </div>
        )}

        {children.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <Link
                href={`/igraci/${c.id}`}
                className="font-medium text-navy hover:text-crimson hover:underline"
              >
                {c.lastName} {c.firstName}
              </Link>
              <p className="text-xs text-ink/50">
                {c.birthYear}.
                {!isMinorByBirthYear(c.birthYear) && " · punoljetan/na"}
              </p>
            </div>
            <RemoveChildButton playerId={c.id} name={`${c.firstName} ${c.lastName}`} />
          </div>
        ))}

        {managed.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink/50">
            Još nemaš nijedan povezan profil.
          </p>
        )}
      </div>

      <h2 className="font-display text-lg font-semibold text-navy mb-2">
        Dodaj dijete
      </h2>
      <p className="mb-3 text-sm text-ink/60">
        Upiši pristupni kod koji si dobio/la od kluba. Vrijedi jednokratno i
        samo za igrače mlađe od 18 godina — punoljetni igrači otvaraju vlastiti
        račun.
      </p>
      <AddChildForm />
    </div>
  );
}
