import { OBJECTION_PERIOD_DAYS } from "@/lib/scoring/results-lock";
import { SYSTEM_EMAIL } from "@/lib/contact";

/**
 * Napomena o pravu na prigovor — čl. 29.
 *
 * Pravilnik daje rok, a sustav ga i provodi (rezultati se nakon njega
 * zaključavaju), ali stranica dosad nigdje nije rekla KOME se prigovara.
 * Rok koji nema adresu nije pravo nego formalnost.
 *
 * Kad rok istekne, tekst se mijenja. Prva inačica ove komponente je i nakon
 * isteka pozivala na prigovor s datumom u prošlosti — čl. 29 izrijekom kaže
 * da se rezultat tada smatra konačnim, pa je stranica tvrdila suprotno od
 * pravilnika.
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ObjectionNote({
  deadline,
  now = new Date(),
}: {
  deadline?: Date | null;
  now?: Date;
}) {
  const expired = deadline ? now > deadline : false;

  if (expired && deadline) {
    return (
      <p className="mt-4 max-w-prose text-xs text-ink/60">
        Rok za prigovor na izračun bodova istekao je{" "}
        <strong className="text-ink/75">{formatDate(deadline)}</strong> i
        rezultat se smatra konačnim (čl. 29). Razrada bodova po turniru
        vidljiva je na profilu igrača; za pitanja se javi na{" "}
        <a
          href={`mailto:${SYSTEM_EMAIL}`}
          className="font-medium text-navy hover:underline"
        >
          {SYSTEM_EMAIL}
        </a>
        .
      </p>
    );
  }

  return (
    <p className="mt-4 max-w-prose text-xs text-ink/60">
      Prigovor na izračun bodova podnosi se u roku od {OBJECTION_PERIOD_DAYS}{" "}
      dana od objave rezultata (čl. 29)
      {deadline && (
        <>
          , dakle do{" "}
          <strong className="text-ink/75">{formatDate(deadline)}</strong>
        </>
      )}
      , na{" "}
      <a
        href={`mailto:${SYSTEM_EMAIL}`}
        className="font-medium text-navy hover:underline"
      >
        {SYSTEM_EMAIL}
      </a>
      . Razrada bodova po turniru vidljiva je na profilu igrača.
    </p>
  );
}
