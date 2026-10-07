"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="rank-badge mb-4" data-parity="even">
        !
      </span>
      <h1 className="page-title mb-2">
        Nešto je pošlo po zlu
      </h1>
      <p className="mb-6 text-muted">
        {error.message || "Došlo je do neočekivane greške."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="btn-primary btn-lg"
        >
          Pokušaj ponovno
        </button>
        <Link
          href="/"
          className="btn-secondary btn-lg"
        >
          Naslovnica
        </Link>
      </div>
    </div>
  );
}
