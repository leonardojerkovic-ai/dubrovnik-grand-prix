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
        className="btn-secondary"
      >
        Dodaj u svoj kalendar
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-navy/10 bg-white px-4 py-3">
          <p className="mb-3 text-sm text-muted">
            Kalendar se sam osvježava. Kad se termin turnira promijeni,
            promijenit će se i kod tebe — ništa ne treba ponovno dodavati.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href={webcal}
              className="btn-primary"
            >
              Apple, Outlook i ostali
            </a>
            <a
              href={google}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
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
              className="btn-secondary"
            >
              {copied ? "Kopirano." : "Kopiraj poveznicu"}
            </button>
          </div>

          <p className="mt-3 text-xs text-muted">
            Na mobitelu je najlakše prvi gumb. Ako ne otvori kalendar, kopiraj
            poveznicu i dodaj je ručno kao pretplatu na kalendar.
          </p>
        </div>
      )}
    </div>
  );
}
