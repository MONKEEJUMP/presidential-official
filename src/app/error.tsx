"use client";

import Link from "next/link";

type ErrorPageProps = {
  readonly error: Error & { digest?: string };
  readonly unstable_retry: () => void;
};

export default function ErrorPage({ unstable_retry }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center bg-zinc-50 px-6 py-20 text-zinc-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 border border-zinc-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase text-emerald-800">
          Official Presidential
        </p>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight">
            This page could not load
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-700">
            The official Presidential experience is still protected. Try again
            or return to the official home.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="border border-emerald-900 bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            onClick={() => unstable_retry()}
            type="button"
          >
            Try again
          </button>
          <Link
            className="border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-500"
            href="/"
          >
            Return home
          </Link>
        </div>
        <p className="text-sm font-medium text-zinc-600">
          For adults 21+ where legal.
        </p>
      </section>
    </main>
  );
}
