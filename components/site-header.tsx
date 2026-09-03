"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { JOIN_LINK, PRIMARY_NAV as NAV, SECONDARY_NAV } from "@/lib/nav";

const LJESTVICE = [
  { href: "/ljestvice/opci-gp", label: "Opći GP" },
  { href: "/ljestvice/zene", label: "Žene" },
  { href: "/ljestvice/u20", label: "U20" },
  { href: "/ljestvice/u16", label: "U16" },
  { href: "/ljestvice/u12", label: "U12" },
  { href: "/ljestvice/s50", label: "S50" },
  { href: "/ljestvice/s65", label: "S65" },
  { href: "/ljestvice/u1800", label: "U1800" },
  { href: "/ljestvice/akademija", label: "Akademija" },
];


export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: session, status } = useSession();
  const user = session?.user as
    | { email?: string | null; role?: string; playerId?: string | null; displayName?: string | null }
    | undefined;
  const signedIn = status === "authenticated";
  const isAdmin = user?.role === "ADMIN" || user?.role === "GP_MANAGER";
  // Ime dolazi iz povezanog igračkog profila; dok veza ne postoji, email je
  // jedino čime se korisnik može predstaviti.
  const label = user?.displayName ?? user?.email ?? "";

  return (
    <header className="border-b border-navy/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-bold text-navy"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-lg">ŠK Dubrovnik</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-navy">
          <div className="group relative">
            <button className="hover:text-crimson transition-colors">
              Ljestvice
            </button>
            <div className="absolute left-0 top-full hidden group-hover:flex flex-col gap-1 rounded-md border border-navy/10 bg-paper p-2 shadow-lg min-w-[160px]">
              {LJESTVICE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-1 hover:bg-sky-light"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-crimson transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dok se sesija učitava ne prikazuje se ništa — treptanje između
              "Prijava" i imena korisnika djelovalo bi kao greška. */}
          {status === "loading" ? null : signedIn ? (
            <div className="hidden items-center gap-3 sm:flex">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/moji-igraci"
                className="max-w-[14rem] truncate text-sm font-medium text-navy hover:text-crimson"
                title={label}
              >
                {label}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-ink/60 hover:text-crimson"
              >
                Odjava
              </button>
            </div>
          ) : (
            <>
              <Link
                href={JOIN_LINK.href}
                className="hidden rounded-md border border-gold px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-gold/15 md:inline-block"
              >
                {JOIN_LINK.label}
              </Link>
              <Link
                href="/prijava"
                className="hidden sm:inline-block rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy-light transition-colors"
              >
                Prijava
              </Link>
            </>
          )}

          {/* Hamburger — samo ispod lg breakpointa */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Zatvori izbornik" : "Otvori izbornik"}
            aria-expanded={mobileOpen}
            className="lg:hidden flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-md border border-navy/20"
          >
            <span
              className={`block h-0.5 w-5 bg-navy transition-transform ${mobileOpen ? "translate-y-[5px] rotate-45" : ""}`}
            />
            <span className={`block h-0.5 w-5 bg-navy transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span
              className={`block h-0.5 w-5 bg-navy transition-transform ${mobileOpen ? "-translate-y-[5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobilni panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-navy/10 bg-paper px-4 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Ljestvice
          </p>
          <div className="mb-4 grid grid-cols-2 gap-1">
            {LJESTVICE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light active:bg-sky-light"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Stranice
          </p>
          <div className="mb-4 grid gap-1">
            {[...NAV, JOIN_LINK, ...SECONDARY_NAV].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light active:bg-sky-light"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {signedIn ? (
            <div className="grid gap-2 border-t border-navy/10 pt-3">
              <p className="px-2 text-xs text-ink/50">Prijavljeni ste kao</p>
              <p className="truncate px-2 text-sm font-medium text-navy">{label}</p>
              <Link
                href="/moji-igraci"
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light"
              >
                Moji igrači
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light"
                >
                  Admin panel
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="rounded px-2 py-2.5 text-left text-sm text-crimson hover:bg-crimson/5"
              >
                Odjava
              </button>
            </div>
          ) : (
            <Link
              href="/prijava"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md bg-navy px-4 py-2 text-center text-sm font-semibold text-paper hover:bg-navy-light"
            >
              Prijava
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
