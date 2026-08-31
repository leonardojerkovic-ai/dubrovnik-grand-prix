import { createSeason } from "../actions";
import { SeasonForm } from "../season-form";

export default function NewSeasonPage() {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Nova sezona
      </h2>
      <SeasonForm action={createSeason} />
    </div>
  );
}
