export function RankBadge({ place }: { place: number }) {
  const parity = place % 2 === 0 ? "even" : "odd";
  return (
    <span
      className="rank-badge"
      data-parity={parity}
      data-place={place === 1 ? "1" : undefined}
    >
      {place}
    </span>
  );
}
