"use client";

import { useState } from "react";
import Link from "next/link";

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

const NAV = [
  { href: "/o-nama", label: "O nama" },
  { href: "/faq", label: "FAQ" },
  { href: "/kalendar", label: "Kalendar" },
  { href: "/prijave", label: "Prijave na turnire" },
  { href: "/dokumenti", label: "Dokumenti" },
  { href: "/postani-clan", label: "Postani član" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-navy/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-bold text-navy"
          onClick={() => setMobileOpen(false)}
        >
          <span className="text-lg">ŠK Dubrovnik</span>
          <span className="badge-title">Grand Prix</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-navy">
          <div className="group relative">
            <button className="hover:text-crimson transition-colors">
              Poredak po ljestvicama
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
          <Link
            href="/prijava"
            className="hidden sm:inline-block rounded-md bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-navy-light transition-colors"
          >
            Prijava
          </Link>

          {/* Hamburger — samo ispod lg breakpointa */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Zatvori izbornik" : "Otvori izbornik"}
            aria-expanded={mobileOpen}
            className="lg:hidden flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md border border-navy/20"
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
                className="rounded px-2 py-1.5 text-sm text-navy hover:bg-sky-light"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Stranice
          </p>
          <div className="mb-4 grid gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-1.5 text-sm text-navy hover:bg-sky-light"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/prijava"
            onClick={() => setMobileOpen(false)}
            className="block rounded-md bg-navy px-4 py-2 text-center text-sm font-semibold text-paper hover:bg-navy-light"
          >
            Prijava
          </Link>
        </div>
      )}
    </header>
  );
}
