import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePlayer } from "../actions";
import { PlayerForm } from "../player-form";

export default async function EditPlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true } } },
  });
  if (!player) notFound();

  const boundUpdatePlayer = updatePlayer.bind(null, player.id);

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-navy mb-1">
        Uredi igrača — {player.firstName} {player.lastName}
      </h2>

      {/* Druga strana veze računa i profila; upravlja se u Admin → Korisnici. */}
      <p className="mb-4 text-xs text-ink/55">
        {player.user
          ? `Povezan korisnički račun: ${player.user.email}`
          : "Nema povezanog korisničkog računa."}{" "}
        <a href="/admin/users" className="text-navy underline hover:text-crimson">
          Upravljanje vezama
        </a>
      </p>
      <PlayerForm
        action={boundUpdatePlayer}
        defaultValues={{
          firstName: player.firstName,
          lastName: player.lastName,
          fideId: player.fideId,
          title: player.title,
          gender: player.gender,
          birthYear: player.birthYear,
          isClubMember: player.isClubMember,
          memberSince: player.memberSince,
          memberUntil: player.memberUntil,
          deceased: player.deceased,
          deceasedYear: player.deceasedYear,
        }}
      />
    </div>
  );
}
