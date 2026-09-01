import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-xs text-ink/50 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} ŠK Dubrovnik — osnovan 1933.</p>
        <div className="flex gap-4">
          <Link href="/privatnost" className="hover:text-navy">
            Politika privatnosti
          </Link>
          <Link href="/o-nama" className="hover:text-navy">
            O nama
          </Link>
        </div>
      </div>
    </footer>
  );
}
