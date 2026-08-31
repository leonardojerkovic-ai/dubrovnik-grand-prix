import { createPlayer } from "../actions";
import { PlayerForm } from "../player-form";

export default function NewPlayerPage() {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Novi igrač
      </h2>
      <PlayerForm action={createPlayer} />
    </div>
  );
}
