"use client";

import { useState, useTransition } from "react";
import { removeChild } from "./actions";

export function RemoveChildButton({
  playerId,
  name,
}: {
  playerId: string;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-ink/50 hover:text-crimson"
      >
        ukloni
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-ink/60">Ukloniti {name}?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await removeChild(playerId);
          })
        }
        className="font-semibold text-crimson hover:underline disabled:opacity-50"
      >
        da
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-ink/50 hover:text-navy"
      >
        ne
      </button>
    </span>
  );
}
