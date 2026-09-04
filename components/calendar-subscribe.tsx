"use client";

import { useState } from "react";

/**
 * Pretplata na kalendar turnira.
 *
 * Nudi tri puta jer se ponašaju različito: `webcal://` većina programa
 * otvori izravno kao pretplatu, Google traži vlastitu adresu, a kopiranje
 * poveznice pokriva sve ostalo. Preuzimanje datoteke namjerno nije istaknuto
 * — ono ubaci turnire jednom i poslije se ne osvježava.
 */
export function CalendarSubscribe() {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/kalendar.ics`
      : "/kalendar.ics";
  const webcal = url.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
      >
        Dodaj u svoj kalendar
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-navy/10 bg-white px-4 py-3">
          <p className="mb-3 text-sm text-ink/65">
            Kalendar se sam osvježava. Kad se termin turnira promijeni,
            promijenit će se i kod tebe — ništa ne treba ponovno dodavati.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href={webcal}
              className="rounded-md bg-navy px-3.5 py-2 text-sm font-semibold text-paper hover:bg-navy-light"
            >
              Apple, Outlook i ostali
            </a>
            <a
              href={google}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-navy/20 px-3.5 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Google Kalendar
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-md border border-navy/20 px-3.5 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              {copied ? "Kopirano." : "Kopiraj poveznicu"}
            </button>
          </div>

          <p className="mt-3 text-xs text-ink/50">
            Na mobitelu je najlakše prvi gumb. Ako ne otvori kalendar, kopiraj
            poveznicu i dodaj je ručno kao pretplatu na kalendar.
          </p>
        </div>
      )}
    </div>
  );
}
