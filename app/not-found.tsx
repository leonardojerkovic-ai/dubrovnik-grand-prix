import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="rank-badge mb-4" data-parity="odd">
        ?
      </span>
      <h1 className="page-title mb-2">
        Stranica nije pronađena
      </h1>
      <p className="mb-6 text-muted">
        Stranica koju tražiš ne postoji ili je premještena — možda je krivi
        potez odveo u slijepu ulicu.
      </p>
      <Link
        href="/"
        className="btn-primary btn-lg"
      >
        Natrag na naslovnicu
      </Link>
    </div>
  );
}
