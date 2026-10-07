"use client";

import { useState } from "react";

/**
 * Gumb koji složeni tekst prekopira u međuspremnik, uz pregled prije toga.
 *
 * Klub obavijesti šalje kroz WhatsApp, pa se tekst sastavlja iz podataka koji
 * su već u sustavu i samo zalijepi u razgovor. Pregled postoji zato da se
 * vidi što se kopira — poruka ide stotinjak ljudi i ispravlja se teško.
 */
export function CopyTextButton({
  text,
  label,
  hint,
}: {
  text: string;
  label: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary"
      >
        {label}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-navy/10 bg-white p-3">
          {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}

          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-paper px-3 py-2.5 text-sm text-ink">
            {text}
          </pre>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn-primary mt-2"
          >
            {copied ? "Kopirano." : "Kopiraj tekst"}
          </button>
        </div>
      )}
    </div>
  );
}
