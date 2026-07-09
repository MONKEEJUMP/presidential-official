export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-po-soft px-6 py-20 text-po-ink"
      role="status"
    >
      <section className="w-full max-w-xl border border-po-line bg-po-canvas p-8">
        <p className="text-sm font-semibold uppercase text-po-brand">
          Official Presidential
        </p>
        <p className="mt-4 text-3xl font-semibold leading-tight">
          Loading Presidential
        </p>
        <p className="mt-4 text-base leading-7 text-po-body">
          Preparing the official Presidential experience for adults 21+ where
          legal.
        </p>
      </section>
    </div>
  );
}
