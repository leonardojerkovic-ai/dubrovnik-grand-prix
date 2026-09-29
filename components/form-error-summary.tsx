/**
 * Sažetak grešaka na vrhu obrasca.
 *
 * Greške se i dalje ispisuju uz pojedino polje, ali to nije dovoljno iz dva
 * razloga. Prvo, provjera može pasti na pravilu koje ne pripada nijednom
 * vidljivom polju — u shemi turnira takvo je pravilo da Juniorsko Finale mora
 * biti označeno i kao završni turnir. Tada obrazac ostaje posve tih i izgleda
 * kao da spremanje nije ni pokušano.
 *
 * Drugo, React 19 nakon slanja obrasca sam prazni polja, pa se korisnik nakon
 * neuspjeha vraća na praznu formu. Poruka uz polje koje je u međuvremenu
 * očišćeno lako promakne; sažetak na vrhu ne.
 */
export function FormErrorSummary({
  errors,
}: {
  errors?: Record<string, string[]>;
}) {
  const messages = Object.values(errors ?? {}).flat().filter(Boolean);
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-ink"
    >
      <p className="font-semibold text-crimson">
        {messages.length === 1
          ? "Spremanje nije uspjelo:"
          : "Spremanje nije uspjelo. Treba ispraviti:"}
      </p>
      <ul className="mt-1 list-disc pl-5 text-ink/80">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
