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
          <div className="grid gap-3">
            <div>
              <p className="font-semibold text-navy">Ispuni pristupnicu</p>
              <p className="text-sm text-ink/60">
                Pristupnicu možeš ispuniti izravno na mrežnoj stranici kluba
                ili je preuzeti, ispuniti i poslati e-poštom.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.skdubrovnik.hr/upisnica/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy-light transition-colors"
              >
                Ispuni online pristupnicu
              </a>
              <a
                href="https://www.skdubrovnik.hr/dokumenti/upisnica.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
              >
                Preuzmi pristupnicu (PDF)
              </a>
            </div>

            <div className="rounded-md bg-paper px-3 py-2.5 text-sm text-ink/70">
              <p className="mb-1 font-medium text-navy">Šalje se e-poštom na</p>
              <a
                href="mailto:skdubrovnik@skdubrovnik.hr?subject=Pristupnica%20-%20u%C4%8Dlanjenje%20u%20%C5%A0K%20Dubrovnik"
                className="font-mono text-navy underline hover:text-crimson"
              >
                skdubrovnik@skdubrovnik.hr
              </a>
              <p className="mt-2">
                Uz ispunjenu pristupnicu prilažu se preslika osobne iskaznice
                (obostrano) i potvrda o uplati članarine.
              </p>
            </div>
          </div>
        </li>
      </ol>

      <section className="mb-8 rounded-lg border border-navy/10 bg-white px-4 py-4">
        <h2 className="font-display text-lg font-bold text-navy mb-3">
          Članarina
        </h2>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-navy/[0.07] pb-2">
            <dt className="text-ink/70">
              Učenici, studenti, nezaposleni, umirovljenici i osobe s
              invaliditetom
            </dt>
            <dd className="whitespace-nowrap font-mono font-semibold text-navy">
              15 EUR
            </dd>
          </div>
          <div className="flex justify-between gap-4 pb-1">
            <dt className="text-ink/70">Zaposleni</dt>
            <dd className="whitespace-nowrap font-mono font-semibold text-navy">
              30 EUR
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-ink/60">
          Igrači koji žele nastupati na službenim turnirima trebaju FIDE ID.
          Registraciju pri Hrvatskom šahovskom savezu klub može obaviti uz
          dodatnu naknadu — 10 EUR za kadete do 16 godina, 20 EUR za ostale.
        </p>

        <div className="mt-4 rounded-md bg-paper px-3 py-3 text-sm">
          <p className="font-medium text-navy">Podaci za uplatu</p>
          <dl className="mt-2 grid gap-1 text-ink/75">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink/50">Primatelj:</dt>
              <dd>Šahovski klub Dubrovnik, Liechtensteinov put 12, 20000 Dubrovnik</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink/50">IBAN:</dt>
              <dd className="font-mono">HR8224070001100022033</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink/50">Poziv na broj:</dt>
              <dd className="font-mono">00 1-2026</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink/50">Opis:</dt>
              <dd>ime i prezime osobe za koju se članarina uplaćuje</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mb-8 text-sm text-ink/70">
        <h2 className="font-display text-lg font-bold text-navy mb-2">Kontakt</h2>
        <ul className="grid gap-1">
          <li>
            Uprava:{" "}
            <a href="mailto:skdubrovnik@skdubrovnik.hr" className="text-navy underline hover:text-crimson">
              skdubrovnik@skdubrovnik.hr
            </a>
          </li>
          <li>
            Škola šaha:{" "}
            <a href="mailto:skola@skdubrovnik.hr" className="text-navy underline hover:text-crimson">
              skola@skdubrovnik.hr
            </a>
          </li>
          <li>
            Prijave na turnire:{" "}
            <a href="mailto:prijave@skdubrovnik.hr" className="text-navy underline hover:text-crimson">
              prijave@skdubrovnik.hr
            </a>
          </li>
        </ul>
      </section>

      <Link
        href="/registracija"
        className="inline-block rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors"
      >
        Registriraj se
      </Link>
    </div>
  );
}
