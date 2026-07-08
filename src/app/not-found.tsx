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
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-emerald-900 focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-emerald-950 focus:shadow-lg"
        href="#presidential-main"
      >
        Skip to main content
      </a>
      <main
        className="flex min-h-screen items-center bg-zinc-50 px-6 py-20 text-zinc-950"
        id="presidential-main"
        tabIndex={-1}
      >
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 border border-zinc-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase text-emerald-800">
          Official Presidential
        </p>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Page not found
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-700">
            This Presidential page is not available. Continue through the
            official home while approved sections are finalized.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="border border-emerald-900 bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            href="/"
          >
            Return to Presidential home
          </Link>
          <Link
            className="border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-500"
            href="/learn"
          >
            Explore Presidential learning
          </Link>
        </div>
        <p className="text-sm font-medium text-zinc-600">
          For adults 21+ where legal.
        </p>
      </section>
      </main>
    </>
  );
}
