/**
 * Crvena poruka na vrhu admin popisa, za odbijene radnje.
 *
 * Isti izgled kao FormErrorSummary, ali bez obrasca: ovo stoji na stranici
 * na koju je odbijena radnja preusmjerila (vidi lib/admin-odbijanje.ts).
 */
export function AdminNotice({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mb-4 rounded-md border border-crimson/30 bg-crimson/10 px-4 py-3 text-sm text-crimson"
    >
      {message}
    </p>
  );
}
