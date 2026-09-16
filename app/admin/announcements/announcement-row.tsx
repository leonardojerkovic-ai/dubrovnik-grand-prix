"use client";

import { useState } from "react";
import { updateAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";
import type { ActionState } from "../players/actions";

type Option = { id: string; name: string };
type SeasonOption = { id: string; yearLabel: string; system: string };

/**
 * Redak najave u adminu, s mogućnošću uređivanja na mjestu.
 *
 * Najava se mijenja češće nego što se čini — ispravi se datum u tekstu,
 * naknadno poveže s turnirom, dopuni satnica. Prije je jedini put bio
 * obrisati je i napisati iznova, čime se gubio datum objave.
 */
export function AnnouncementRow({
  id,
  title,
  body,
  meta,
  tournamentId,
  seasonId,
  tournaments,
  seasons,
  deleteButton,
}: {
  id: string;
  title: string;
  body: string;
  meta: string;
  tournamentId: string | null;
  seasonId: string | null;
  tournaments: Option[];
  seasons: SeasonOption[];
  deleteButton: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  const boundUpdate = async (state: ActionState, formData: FormData) =>
    updateAnnouncement(id, state, formData);

  return (
    <div className="rounded-lg border border-navy/10 bg-white p-4">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-navy">{title}</p>
          <p className="text-xs text-ink/50">{meta}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-medium text-navy hover:text-crimson"
          >
            {editing ? "Zatvori" : "Uredi"}
          </button>
          {deleteButton}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 border-t border-navy/10 pt-3">
          <AnnouncementForm
            action={boundUpdate}
            tournaments={tournaments}
            seasons={seasons}
            defaultValues={{ title, body, tournamentId, seasonId }}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : (
        <p className="text-sm text-ink/70 whitespace-pre-wrap">{body}</p>
      )}
    </div>
  );
}
