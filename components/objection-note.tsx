import { OBJECTION_PERIOD_DAYS } from "@/lib/scoring/results-lock";
import { SYSTEM_EMAIL } from "@/lib/contact";

/**
 * Napomena o pravu na prigovor — čl. 29.
 *
 * Pravilnik daje rok, a sustav ga i provodi (rezultati se nakon njega
 * zaključavaju), ali stranica dosad nigdje nije rekla KOME se prigovara.
 * Rok koji nema adresu nije pravo nego formalnost.
 *
 * Kad je poznat datum objave rezultata, ispisuje se i konkretan datum
 * isteka — igraču je to korisnije od broja dana.
 */
export function ObjectionNote({
  deadline,
}: {
  deadline?: Date | null;
}) {
  return (
    <p className="mt-4 max-w-prose text-xs text-ink/60">
      Prigovor na izračun bodova podnosi se u roku od {OBJECTION_PERIOD_DAYS}{" "}
      dana od objave rezultata (čl. 29)
      {deadline && (
        <>
          , dakle do{" "}
          <strong className="text-ink/75">
            {deadline.toLocaleDateString("hr-HR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
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
