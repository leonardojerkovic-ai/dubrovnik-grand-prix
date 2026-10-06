/**
 * Poruka na vrhu admin popisa: odbijena radnja (crveno) ili napomena uz
 * radnju koja je prošla (žuto).
 *
 * Isti izgled kao FormErrorSummary, ali bez obrasca: ovo stoji na stranici na
 * koju je radnja preusmjerila (vidi lib/admin-odbijanje.ts).
 */
export function AdminNotice({
  message,
  tone = "greska",
}: {
  message?: string;
  tone?: "greska" | "napomena";
}) {
  if (!message) return null;

  const stil =
    tone === "napomena"
      ? "border-gold/40 bg-gold/10 text-navy"
      : "border-crimson/30 bg-crimson/10 text-crimson";

  return (
    <p
      role="alert"
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${stil}`}
    >
      {message}
    </p>
  );
}
