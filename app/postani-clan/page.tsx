import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Postani član",
  description: "Kako postati član Šahovskog kluba Dubrovnik.",
};

export default function PostaniClanPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        Postani član
      </h1>
      <div className="grid gap-4 text-ink/80 mb-8">
        <p>
          Članstvo u ŠK Dubrovnik otvoreno je svim zainteresiranima, bez
          obzira na dob ili razinu igre. Članovi kluba imaju pravo nastupa na
          svim turnirima kalendara i ulaze u službene ljestvice Dubrovnik
          Grand Prixa.
        </p>
        <p>Postupak učlanjenja u dva koraka:</p>
      </div>

      <ol className="grid gap-3 mb-8">
        <li className="flex gap-3 rounded-lg border border-navy/10 bg-white px-4 py-3">
          <span className="rank-badge" data-parity="odd">1</span>
          <div>
            <p className="font-semibold text-navy">Kreiraj korisnički račun</p>
            <p className="text-sm text-ink/60">
              Registriraj se na stranici kako bi mogao/la pratiti svoje
              rezultate i prijavljivati se na turnire.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-lg border border-navy/10 bg-white px-4 py-3">
          <span className="rank-badge" data-parity="even">2</span>
          <div>
            <p className="font-semibold text-navy">Javi se klubu</p>
            <p className="text-sm text-ink/60">
              Kontaktiraj upravu kluba radi potvrde članstva i informacija o
              članarini — nakon potvrde tvoj profil postaje vidljiv na
              službenim ljestvicama.
            </p>
          </div>
        </li>
      </ol>

      <Link
        href="/registracija"
        className="inline-block rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors"
      >
        Registriraj se
      </Link>
    </div>
  );
}
