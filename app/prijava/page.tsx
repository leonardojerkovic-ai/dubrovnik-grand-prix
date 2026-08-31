"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function PrijavaPage() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Pogrešan email ili lozinka.");
      return;
    }
    window.location.href = res?.url ?? callbackUrl;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Prijava</h1>

      <form onSubmit={handleCredentialsSubmit} className="grid gap-4">
        {error && (
          <p className="rounded-md bg-crimson/10 px-3 py-2 text-sm text-crimson">
            {error}
          </p>
        )}
        <label className="grid gap-1 text-sm font-medium text-navy">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-navy">
          Lozinka
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-navy px-4 py-2.5 font-semibold text-paper hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? "Prijava…" : "Prijavi se"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-navy/10" />
        ILI
        <div className="h-px flex-1 bg-navy/10" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="rounded-md border border-navy/20 px-4 py-2.5 font-semibold text-navy hover:bg-navy/5 transition-colors"
      >
        Nastavi s Google računom
      </button>
      <p className="mt-4 text-sm text-ink/60">
        Nemaš račun?{" "}
        <a href="/registracija" className="text-navy underline">
          Registriraj se
        </a>
      </p>
    </div>
  );
}
