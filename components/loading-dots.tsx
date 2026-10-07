/**
 * Pulsirajuća šahovnica umjesto spinnera — ista za sve rute.
 *
 * Tri su loading.tsx datoteke imale isti ovaj blok s rukom upisanim hex
 * vrijednostima, pa ih promjena palete nije zahvaćala. Boje sada dolaze iz
 * Tailwind klasa, dakle iz lib/design-tokens.ts.
 */
export function LoadingDots() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 animate-pulse rounded-sm ${
              i % 2 === 0 ? "bg-navy" : "bg-gold"
            }`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
