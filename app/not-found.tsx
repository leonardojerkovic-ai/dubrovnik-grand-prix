import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="rank-badge mb-4" data-parity="odd">
        ?
      </span>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Stranica nije pronađena
      </h1>
      <p className="mb-6 text-ink/60">
        Stranica koju tražiš ne postoji ili je premještena — možda je krivi
        potez odveo u slijepu ulicu.
      </p>
      <Link
        href="/"
        className="rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors"
      >
        Natrag na naslovnicu
      </Link>
    </div>
  );
}
