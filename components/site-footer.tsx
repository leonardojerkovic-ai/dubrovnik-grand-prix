import Link from "next/link";
import { SECONDARY_NAV } from "@/lib/nav";
import { SYSTEM_EMAIL } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-xs text-ink/50 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()}{" "}
          {/*
            Poveznica na glavnu stranicu kluba. U podnožju, a ne u izborniku:
            vidljiva je sa svake stranice, a izbornik ostaje kratak. Otvara se
            u novoj kartici jer vodi izvan ovog sustava.
          */}
          <a
            href="https://www.skdubrovnik.hr/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy hover:text-crimson hover:underline"
          >
            Šahovski klub Dubrovnik
          </a>{" "}
          — osnovan 1933.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {SECONDARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-navy">
              {item.label}
            </Link>
          ))}
          <Link href="/privatnost" className="hover:text-navy">
            Politika privatnosti
          </Link>
          {/*
            Adresa ovog sustava, ne kluba — vidi lib/contact.ts. Klupske
            adrese stoje na /postani-clan i ondje su mjerodavne.
          */}
          <a
            href={`mailto:${SYSTEM_EMAIL}`}
            className="hover:text-navy"
            title="Pitanja o bodovima i ljestvicama"
          >
            {SYSTEM_EMAIL}
          </a>
          {/* Vanjske poveznice: matični klub i županijski savez. */}
          <a
            href="https://www.skdubrovnik.hr/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-navy"
          >
            skdubrovnik.hr ↗
          </a>
          <a
            href="https://ssdnz.hr/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-navy"
            title="Šahovski savez Dubrovačko-neretvanske županije"
          >
            ssdnz.hr ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
