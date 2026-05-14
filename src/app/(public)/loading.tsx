export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border px-4 py-4 animate-pulse space-y-2"
          >
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  );
}
