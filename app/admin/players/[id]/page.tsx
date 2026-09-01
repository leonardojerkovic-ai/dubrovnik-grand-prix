import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePlayer } from "../actions";
import { PlayerForm } from "../player-form";

export default async function EditPlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await prisma.player.findUnique({ where: { id: params.id } });
  if (!player) notFound();

  const boundUpdatePlayer = updatePlayer.bind(null, player.id);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-4">
        Uredi igrača — {player.firstName} {player.lastName}
      </h2>
      <PlayerForm
        action={boundUpdatePlayer}
        defaultValues={{
          firstName: player.firstName,
          lastName: player.lastName,
          fideId: player.fideId,
          title: player.title,
          gender: player.gender,
          birthYear: player.birthYear,
          birthDate: player.birthDate,
          isClubMember: player.isClubMember,
          memberSince: player.memberSince,
          memberUntil: player.memberUntil,
        }}
      />
    </div>
  );
}
