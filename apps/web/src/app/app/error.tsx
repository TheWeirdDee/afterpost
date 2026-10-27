"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page">
      <div className="empty" role="alert">
        <h3>Something went wrong loading this screen</h3>
        <p>
          The request failed before any data could be shown. Nothing was changed. Try again, and
          quote the diagnostic ID if it keeps happening.
        </p>
        <span className="pill bad mono">Diagnostic {error.digest ?? "ERR-LOCAL-0001"}</span>
        <button className="btn primary sm" onClick={reset}>
          Retry
        </button>
      </div>
    </div>
  );
}
