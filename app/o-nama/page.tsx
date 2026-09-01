import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O nama",
  description: "Povijest i djelovanje Šahovskog kluba Dubrovnik, osnovanog 1933.",
};

export default function ONamaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <span className="badge-title mb-3 inline-block">Od 1933.</span>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        O nama
      </h1>
      <div className="prose prose-sm max-w-none text-ink/80 grid gap-4">
        <p>
          Šahovski klub Dubrovnik jedan je od najstarijih športskih klubova u
          gradu, s dugom tradicijom natjecateljskog i klupskog šaha.
        </p>
        <p>
          Dubrovnik Grand Prix je godišnje natjecanje kluba u kojemu se kroz
          cijelu sezonu vrednuju rezultati igrača na turnirima iz kalendara
          Kluba — s ciljem poticanja redovitog natjecanja, nagrađivanja
          kvalitete postignutih rezultata i praćenja napretka članova kroz
          sezonu.
        </p>
        <p>
          Uz glavni Grand Prix, klub vodi i Grand Prix Akademije — razvojno
          natjecanje namijenjeno mlađim i početnim igračima, s ciljem
          poticanja redovitog natjecanja i pripreme igrača za nastup u
          ukupnom klupskom Grand Prixu.
        </p>
      </div>
    </div>
  );
}
