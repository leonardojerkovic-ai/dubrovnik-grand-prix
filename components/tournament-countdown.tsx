"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Odbrojavanje do sljedećeg turnira.
 *
 * Početno stanje dolazi s poslužitelja (`serverNowIso`), pa se prvo iscrtavanje
 * na klijentu poklapa s onim iz SSR-a i nema hydration neslaganja. Tek nakon
 * montiranja prelazi na stvarno vrijeme preglednika i osvježava se svakih
 * pola minute — sekunde ovdje nikome ne trebaju, a tjerale bi nepotrebno
 * ponovno iscrtavanje.
 */

function remaining(targetMs: number, nowMs: number) {
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-hero text-2xl leading-none text-gold tabular-nums md:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-paper/55">
        {label}
      </div>
    </div>
  );
}

export function TournamentCountdown({
  targetIso,
  serverNowIso,
  name,
  href,
}: {
  targetIso: string;
  serverNowIso: string;
  name: string;
  href: string;
}) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState(() => new Date(serverNowIso).getTime());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const left = remaining(target, now);

  return (
    <div className="mt-8 inline-flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-paper/15 bg-paper/[0.06] px-5 py-4">
      {left ? (
        <div className="flex items-start gap-5">
          <Unit value={left.days} label={left.days === 1 ? "dan" : "dana"} />
          <Unit value={left.hours} label="sati" />
          <Unit value={left.minutes} label="min" />
        </div>
      ) : (
        <span className="font-hero text-2xl text-gold">Igra se danas</span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-paper/50">
          Sljedeći turnir
        </p>
        <Link href={href} className="font-medium text-paper hover:underline">
          {name}
        </Link>
      </div>
    </div>
  );
}
