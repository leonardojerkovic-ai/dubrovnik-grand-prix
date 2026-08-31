"use client";

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
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Nešto je pošlo po zlu
      </h1>
      <p className="mb-6 text-ink/60">
        {error.message || "Došlo je do neočekivane greške."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-navy px-5 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors"
        >
          Pokušaj ponovno
        </button>
        <a
          href="/"
          className="rounded-md border border-navy/20 px-5 py-2.5 font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Naslovnica
        </a>
      </div>
    </div>
  );
}
