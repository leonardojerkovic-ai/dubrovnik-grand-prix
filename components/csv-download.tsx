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
      className="mt-4 inline-flex items-center gap-2 rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
    >
      <span aria-hidden>↓</span>
      {label}
    </a>
  );
}
