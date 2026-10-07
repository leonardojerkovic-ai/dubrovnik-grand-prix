"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { JOIN_LINK, PRIMARY_NAV as NAV, SECONDARY_NAV } from "@/lib/nav";
import { jeAktivna, jeAktivnaLjestvica } from "@/lib/nav-aktivno";

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

/**
 * Aktivna stavka se ne označava samo bojom: zlatna crta na papiru ima
 * kontrast 2,04:1, pa bi onome kome boje slabije razlikuje bila nevidljiva.
 * Nosi ju i podebljani font, a čitaču zaslona aria-current="page".
 */
const STAVKA = "relative transition-colors hover:text-crimson";
const STAVKA_AKTIVNA =
  `${STAVKA} font-semibold after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-gold`;

const PADAJUCA = "rounded px-2 py-1 hover:bg-sky-light";
const PADAJUCA_AKTIVNA = `${PADAJUCA} bg-sky-light font-semibold`;

const MOBILNA = "rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light active:bg-sky-light";
const MOBILNA_AKTIVNA = `${MOBILNA} bg-sky-light font-semibold`;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ljestviceOpen, setLjestviceOpen] = useState(false);
  const ljestviceRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  // Prefiks, ne popis devet putanja: tako je gumb oznacen i na arhivskim
  // ljestvicama (/ljestvice/<sezona>/<kategorija>), koje u popisu ne stoje.
  const ljestviceAktivne = jeAktivna(pathname, "/ljestvice");

  /*
    Izbornik se dosad zatvarao samo Escapeom i odlaskom miša. Na dodirnom
    zaslonu nema odlaska miša, pa je ostajao otvoren i nakon klika pokraj
    njega. pointerdown pokriva i miš i dodir, a sluša se samo dok je
    izbornik otvoren.
  */
  useEffect(() => {
    if (!ljestviceOpen) return;
    function zatvoriIzvan(e: PointerEvent) {
      const okvir = ljestviceRef.current;
      if (okvir && e.target instanceof Node && !okvir.contains(e.target)) {
        setLjestviceOpen(false);
      }
    }
    document.addEventListener("pointerdown", zatvoriIzvan);
    return () => document.removeEventListener("pointerdown", zatvoriIzvan);
  }, [ljestviceOpen]);

  const { data: session, status } = useSession();
  const user = session?.user as
    | { email?: string | null; role?: string; playerId?: string | null; displayName?: string | null }
    | undefined;
  const signedIn = status === "authenticated";
  const isAdmin = user?.role === "ADMIN" || user?.role === "GP_MANAGER";
  // Sucu je alat za nagrade jedino čemu ima pristup, pa mu stoji u zaglavlju.
  const isSudac = user?.role === "SUDAC";
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
          {/*
            Izbornik se dosad otvarao samo na group-hover, pa se tipkovnicom
            do ljestvica nije moglo doći — a na zaslonima ≥1024 px ovo je
            jedini put do njih. Sada ga otvara i klik (ili Enter/Space na
            gumbu), zatvara Escape, odabir i klik izvan njega, a aria-expanded
            čitaču zaslona kaže u kojem je stanju. Hover je ostao kakav je bio.

            focus-within:flex je izbačen: iz zatvorenog stanja nikad ne bi ni
            proradio (skrivene poveznice nisu fokusirljive), a otvoreni je
            izbornik držao otvorenim i kad ga Escape zatvori.
          */}
          <div
            ref={ljestviceRef}
            className="group relative"
            onMouseLeave={() => setLjestviceOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setLjestviceOpen(false);
            }}
          >
            <button
              type="button"
              aria-expanded={ljestviceOpen}
              aria-controls="izbornik-ljestvice"
              onClick={() => setLjestviceOpen((v) => !v)}
              className={ljestviceAktivne ? STAVKA_AKTIVNA : STAVKA}
            >
              Ljestvice
            </button>
            <div
              id="izbornik-ljestvice"
              className={`absolute left-0 top-full ${
                ljestviceOpen ? "flex" : "hidden"
              } group-hover:flex flex-col gap-1 rounded-md border border-navy/10 bg-paper p-2 shadow-lg min-w-[160px]`}
            >
              {LJESTVICE.map((item) => {
                const aktivna = jeAktivnaLjestvica(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setLjestviceOpen(false)}
                    aria-current={aktivna ? "page" : undefined}
                    className={aktivna ? PADAJUCA_AKTIVNA : PADAJUCA}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          {NAV.map((item) => {
            const aktivna = jeAktivna(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={aktivna ? "page" : undefined}
                className={aktivna ? STAVKA_AKTIVNA : STAVKA}
              >
                {item.label}
              </Link>
            );
          })}
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
              {isSudac && (
                <Link
                  href="/alati/nagrade"
                  className="rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
                >
                  Nagrade
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Ljestvice
          </p>
          <div className="mb-4 grid grid-cols-2 gap-1">
            {LJESTVICE.map((item) => {
              const aktivna = jeAktivnaLjestvica(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={aktivna ? "page" : undefined}
                  className={aktivna ? MOBILNA_AKTIVNA : MOBILNA}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Stranice
          </p>
          <div className="mb-4 grid gap-1">
            {[...NAV, JOIN_LINK, ...SECONDARY_NAV].map((item) => {
              const aktivna = jeAktivna(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={aktivna ? "page" : undefined}
                  className={aktivna ? MOBILNA_AKTIVNA : MOBILNA}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {signedIn ? (
            <div className="grid gap-2 border-t border-navy/10 pt-3">
              <p className="px-2 text-xs text-ink/60">Prijavljeni ste kao</p>
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
              {isSudac && (
                <Link
                  href="/alati/nagrade"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2.5 text-sm text-navy hover:bg-sky-light"
                >
                  Novčane nagrade
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
