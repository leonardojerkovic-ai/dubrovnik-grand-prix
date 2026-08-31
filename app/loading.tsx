export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-3 w-3 animate-pulse rounded-sm"
            style={{
              backgroundColor: i % 2 === 0 ? "#0B2A5B" : "#D4A93A",
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
