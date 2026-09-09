import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | Presidential",
  description:
    "This Presidential page is not available. Continue through the official Presidential website.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <>
      <main
        className="flex min-h-screen items-center bg-po-soft px-6 py-20 text-po-ink"
        id="presidential-main"
        tabIndex={-1}
      >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 border border-po-line bg-po-canvas p-8">
        <p className="text-sm font-semibold uppercase text-po-brand-ink">
          Official Presidential
        </p>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Page not found
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-body">
            This Presidential page is not available. Continue through the
            official home while approved sections are finalized.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-po-ink transition-colors hover:bg-po-brand-hover"
            href="/"
          >
            Return to Presidential home
          </Link>
          <Link
            className="border border-po-subtle px-4 py-3 text-sm font-semibold text-po-body transition-colors hover:border-po-muted"
            href="/learn"
          >
            Explore Presidential learning
          </Link>
        </div>
        <p className="text-sm font-medium text-po-muted">
          For adults 21+ where legal.
        </p>
      </section>
      </main>
    </>
  );
}
