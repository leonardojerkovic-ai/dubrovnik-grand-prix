import Link from "next/link";
import { SECONDARY_NAV } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-xs text-ink/50 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ŠK Dubrovnik — osnovan 1933.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {SECONDARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-navy">
              {item.label}
            </Link>
          ))}
          <Link href="/privatnost" className="hover:text-navy">
            Politika privatnosti
          </Link>
        </div>
      </div>
    </footer>
  );
}
