export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-20 text-zinc-950"
    >
      <section className="w-full max-w-xl border border-zinc-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase text-emerald-800">
          Official Presidential
        </p>
        <p className="mt-4 text-3xl font-semibold leading-tight">
          Loading Presidential
        </p>
        <p className="mt-4 text-base leading-7 text-zinc-700">
          Preparing the official Presidential experience for adults 21+ where
          legal.
        </p>
      </section>
    </main>
  );
}
