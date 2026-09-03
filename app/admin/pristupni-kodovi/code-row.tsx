"use client";

import { useState, useTransition } from "react";
import {
  issueAndEmailLinkCode,
  issueLinkCode,
  revokeLinkCode,
} from "./actions";

/**
 * Redak s upravljanjem pristupnim kodom jednog igrača.
 *
 * Kod se prikazuje samo neposredno nakon izdavanja — u bazi je otisak, pa
 * ga se poslije ne može ponovno pročitati, nego samo izdati novi.
 */
export function CodeRow({
  playerId,
  playerName,
  hasCode,
  issuedAt,
  usedAt,
}: {
  playerId: string;
  playerName: string;
  hasCode: boolean;
  issuedAt: string | null;
  usedAt: string | null;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const whatsappText = code
    ? `Pozdrav ${playerName}, ovo je tvoj pristupni kod za stranicu ŠK Dubrovnik: ${code}\n` +
      `Upiši ga pri registraciji i tvoj račun će se odmah povezati s tvojim igračkim profilom.`
    : "";

  const run = (fn: () => Promise<{ error?: string; code?: string }>) => {
    setNote(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setNote(res.error);
      if (res.code) setCode(res.code);
      if (!res.code && !res.error) setCode(null);
    });
  };

  return (
    <div className="border-b border-navy/[0.07] px-1 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex-1 text-sm font-medium text-navy">
          {playerName}
        </span>

        <span className="text-xs text-ink/50">
          {usedAt
            ? `iskorišten ${usedAt}`
            : hasCode
              ? `izdan ${issuedAt}, neiskorišten`
              : "bez koda"}
        </span>

        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => issueLinkCode(playerId))}
          className="rounded-md border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
        >
          {hasCode ? "Izdaj novi" : "Izdaj kod"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowEmail((v) => !v)}
          className="rounded-md border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
        >
          Pošalji mailom
        </button>

        {hasCode && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => revokeLinkCode(playerId))}
            className="text-xs text-crimson hover:underline disabled:opacity-50"
          >
            poništi
          </button>
        )}
      </div>

      {showEmail && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adresa e-pošte igrača"
            className="input max-w-xs py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={isPending || !email}
            onClick={() => run(() => issueAndEmailLinkCode(playerId, email))}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
          >
            Izdaj i pošalji
          </button>
        </div>
      )}

      {code && (
        <div className="mt-2 rounded-md bg-paper px-3 py-2.5">
          <p className="text-xs text-ink/55">
            Kod se prikazuje samo sada. Ako ga izgubiš, izdaj novi.
          </p>
          <p className="mt-1 font-mono text-lg tracking-widest text-navy">
            {code}
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(whatsappText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-2 text-xs text-navy underline hover:text-crimson"
          >
            {copied ? "Kopirano." : "Kopiraj poruku za WhatsApp"}
          </button>
        </div>
      )}

      {note && <p className="mt-2 text-xs text-crimson">{note}</p>}
    </div>
  );
}
