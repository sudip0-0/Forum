export default function AuthLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-md border-2 border-border bg-card p-6 animate-pulse">
        <div className="mx-auto h-14 w-14 rounded-md bg-muted" />
        <div className="mx-auto h-6 w-40 rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
      </div>
    </main>
  );
}
