/**
 * Poveznica za preuzimanje CSV-a.
 *
 * Obični <a>, ne gumb s JavaScriptom: datoteku isporučuje poslužitelj preko
 * Content-Disposition zaglavlja, pa preuzimanje radi i bez JS-a, a poveznica
 * se može kopirati i pozvati iz skripte.
 */
export function CsvDownload({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      download
      className="btn-secondary mt-4 gap-2"
    >
      <span aria-hidden>↓</span>
      {label}
    </a>
  );
}
