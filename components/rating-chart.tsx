import type { RatingPoint } from "@/lib/players/profile";

/**
 * Krivulja triju FIDE rejtinga kroz vrijeme.
 *
 * Čisti SVG bez klijentskog JS-a — stranica je javna i statična, pa nema
 * razloga slati biblioteku za graf. Tri linije dijele istu os da se vidi
 * odnos među tempima; boje su jedini razlikovni znak, pa svaka ima i
 * oznaku u legendi s posljednjom vrijednošću.
 */

type Series = {
  key: "standard" | "rapid" | "blitz";
  label: string;
  color: string;
  points: RatingPoint[];
};

const W = 640;
const H = 200;
const PAD = { top: 14, right: 46, bottom: 26, left: 8 };

const MONTHS = [
  "sij",
  "velj",
  "ožu",
  "tra",
  "svi",
  "lip",
  "srp",
  "kol",
  "ruj",
  "lis",
  "stu",
  "pro",
];

export function RatingChart({
  history,
}: {
  history: {
    standard: RatingPoint[];
    rapid: RatingPoint[];
    blitz: RatingPoint[];
  };
}) {
  const allSeries: Series[] = [
    { key: "standard", label: "Standard", color: "#0B2A5B", points: history.standard },
    { key: "rapid", label: "Rapid", color: "#6FA8DC", points: history.rapid },
    { key: "blitz", label: "Blitz", color: "#D4A93A", points: history.blitz },
  ];
  const series = allSeries.filter((s) => s.points.length > 0);

  const all = series.flatMap((s) => s.points);

  if (all.length < 2) {
    return (
      <p className="rounded-lg border border-navy/10 bg-white px-4 py-6 text-sm text-ink/50">
        Još nema dovoljno zabilježenih rejtinga za prikaz krivulje.
      </p>
    );
  }

  const times = all.map((p) => p.date.getTime());
  const values = all.map((p) => p.value);

  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  // Blagi razmak iznad i ispod da linije ne dodiruju rub.
  const minV = Math.min(...values) - 20;
  const maxV = Math.max(...values) + 20;

  const x = (t: number) =>
    maxT === minT
      ? PAD.left
      : PAD.left +
        ((t - minT) / (maxT - minT)) * (W - PAD.left - PAD.right);

  const y = (v: number) =>
    maxV === minV
      ? H / 2
      : PAD.top +
        (1 - (v - minV) / (maxV - minV)) * (H - PAD.top - PAD.bottom);

  const firstDate = new Date(minT);
  const lastDate = new Date(maxT);

  return (
    <div className="rounded-lg border border-navy/10 bg-white p-4">
      <div className="mb-3 flex flex-wrap gap-4">
        {series.map((s) => {
          const last = s.points[s.points.length - 1];
          return (
            <span key={s.key} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="inline-block h-0.5 w-5 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-ink/70">{s.label}</span>
              <span className="font-mono text-navy">{last?.value}</span>
            </span>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Kretanje rejtinga: ${series
          .map((s) => `${s.label} ${s.points[s.points.length - 1]?.value}`)
          .join(", ")}`}
      >
        {series.map((s) => {
          const pts = s.points
            .map((p) => `${x(p.date.getTime()).toFixed(1)},${y(p.value).toFixed(1)}`)
            .join(" ");
          const last = s.points[s.points.length - 1]!;
          return (
            <g key={s.key}>
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={x(last.date.getTime())}
                cy={y(last.value)}
                r={3.5}
                fill={s.color}
              />
              <text
                x={x(last.date.getTime()) + 7}
                y={y(last.value) + 4}
                fontSize="11"
                fill={s.color}
              >
                {last.value}
              </text>
            </g>
          );
        })}

        <text x={PAD.left} y={H - 6} fontSize="11" fill="#8896A6">
          {MONTHS[firstDate.getMonth()]} {firstDate.getFullYear()}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          fontSize="11"
          fill="#8896A6"
          textAnchor="end"
        >
          {MONTHS[lastDate.getMonth()]} {lastDate.getFullYear()}
        </text>
      </svg>
    </div>
  );
}
