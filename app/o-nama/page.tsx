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
        <p>
          Ova stranica pokriva natjecanja i ljestvice. Sve ostalo o klubu —
          vijesti, škola šaha i kontakt — nalazi se na{" "}
          <a
            href="https://www.skdubrovnik.hr/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy underline hover:text-crimson"
          >
            skdubrovnik.hr
          </a>
          .
        </p>
        <p>
          Klub djeluje u sastavu{" "}
          <a
            href="https://ssdnz.hr/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy underline hover:text-crimson"
          >
            Šahovskog saveza Dubrovačko-neretvanske županije
          </a>
          , čija se pojedinačna prvenstva vrednuju i u Dubrovnik Grand Prixu
          (čl. 13.).
        </p>
      </div>
    </div>
  );
}
