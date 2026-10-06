import { PlayerLink } from "@/components/player-link";
import type { MedalCategory } from "@prisma/client";
import { MedalDisc, awardLabel } from "@/components/medal-disc";

/**
 * Prikaz dodijeljenih medalja na stranici turnira — čl. 19 Akademije.
 *
 * Uz kategorijsku medalju koja nije pripala prvom igraču svoje kategorije
 * stoji objašnjenje. Bez njega prikaz izgleda kao pogreška: roditelj vidi da
 * je medalju za U12 dobio četvrtoplasirani i nema načina saznati zašto.
 */

export interface MedalListItem {
  category: MedalCategory;
  place: number;
  playerId: string;
  playerName: string;
  playerIsClubMember: boolean;
  transferred: boolean;
  note: string | null;
}

export function MedalList({ items }: { items: MedalListItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10 bg-white">
      {items.map((item) => (
        <li
          key={`${item.category}-${item.place}`}
          className="flex items-start gap-3 px-4 py-3"
        >
          <MedalDisc category={item.category} place={item.place} />
          <div className="min-w-0">
            <PlayerLink
              id={item.playerId}
              isClubMember={item.playerIsClubMember}
              className="font-medium text-navy"
            >
              {item.playerName}
            </PlayerLink>
            <p className="text-xs text-ink/70">
              {awardLabel(item.category, item.place)}
            </p>
            {item.transferred && (
              <p className="mt-0.5 text-xs text-ink/60">
                Prenesena — igrači ispred u ovoj kategoriji već su primili višu
                medalju (čl. 19).
              </p>
            )}
            {item.note && (
              <p className="mt-0.5 text-xs text-ink/60">{item.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
